import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getEffectiveInstagramAccountId } from './meta.js';
// ── Persistence ──────────────────────────────────────────
const ANALYTICS_FILE = resolve(import.meta.dirname, '..', 'data', 'analytics.json');
export function readAnalytics() {
    try {
        if (existsSync(ANALYTICS_FILE)) {
            return JSON.parse(readFileSync(ANALYTICS_FILE, 'utf-8'));
        }
    }
    catch { /* ignore */ }
    return {};
}
export function writeAnalytics(store) {
    writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}
// ── Meta Graph API fetch helpers ─────────────────────────
async function graphGet(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
        throw new Error(`Meta API: ${data.error.message}`);
    }
    return data;
}
// Fetch published Facebook posts with engagement data
export async function fetchFacebookPosts(pageId, pageToken, since, until) {
    let url = `https://graph.facebook.com/v21.0/${pageId}/published_posts?fields=id,message,created_time,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true)&limit=100&access_token=${pageToken}`;
    if (since)
        url += `&since=${since}`;
    if (until)
        url += `&until=${until}`;
    const posts = [];
    let nextUrl = url;
    while (nextUrl) {
        const data = await graphGet(nextUrl);
        for (const post of data.data || []) {
            const likes = post.likes?.summary?.total_count || 0;
            const comments = post.comments?.summary?.total_count || 0;
            const shares = post.shares?.count || 0;
            posts.push({
                metaPostId: post.id,
                platform: 'facebook',
                publishedAt: post.created_time,
                message: post.message || '',
                imageUrl: post.full_picture,
                permalink: post.permalink_url,
                likes,
                comments,
                shares,
                engagement: likes + comments + shares,
            });
        }
        nextUrl = data.paging?.next || null;
        // Stop after 200 posts max
        if (posts.length >= 200)
            break;
    }
    return posts;
}
// Fetch Instagram media with metrics
export async function fetchInstagramMedia(igAccountId, pageToken, limit = 100) {
    const url = `https://graph.facebook.com/v21.0/${igAccountId}/media?fields=id,caption,timestamp,like_count,comments_count,media_type,permalink,thumbnail_url,media_url&limit=${limit}&access_token=${pageToken}`;
    const data = await graphGet(url);
    const posts = [];
    for (const media of data.data || []) {
        const likes = media.like_count || 0;
        const comments = media.comments_count || 0;
        posts.push({
            metaPostId: media.id,
            platform: 'instagram',
            publishedAt: media.timestamp,
            message: media.caption || '',
            imageUrl: media.thumbnail_url || media.media_url,
            permalink: media.permalink,
            likes,
            comments,
            shares: 0, // IG doesn't expose share count via basic API
            engagement: likes + comments,
        });
    }
    return posts;
}
// ── Main fetch & aggregate ───────────────────────────────
export async function fetchClientAnalytics(clientId, pageConnection, period) {
    const now = new Date();
    const targetPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, month] = targetPeriod.split('-').map(Number);
    const since = `${year}-${String(month).padStart(2, '0')}-01`;
    const untilDate = new Date(year, month, 0); // Last day of month
    const until = `${year}-${String(month).padStart(2, '0')}-${String(untilDate.getDate()).padStart(2, '0')}`;
    // Fetch Facebook posts
    let fbPosts = [];
    let facebookWarning;
    try {
        fbPosts = await fetchFacebookPosts(pageConnection.pageId, pageConnection.pageAccessToken, since, until);
    }
    catch (err) {
        console.error(`FB fetch error for ${clientId}:`, err.message);
        facebookWarning = err.message || 'Facebook analytics could not be loaded.';
    }
    // Fetch Instagram media (if linked)
    let igPosts = [];
    let instagramWarning;
    const instagramAccountId = getEffectiveInstagramAccountId(pageConnection);
    if (instagramAccountId) {
        try {
            igPosts = await fetchInstagramMedia(instagramAccountId, pageConnection.pageAccessToken);
            // Filter IG posts to the target period
            igPosts = igPosts.filter(p => {
                const d = p.publishedAt.slice(0, 10);
                return d >= since && d <= until;
            });
        }
        catch (err) {
            console.error(`IG fetch error for ${clientId}:`, err.message);
            instagramWarning = err.message || 'Instagram analytics could not be loaded.';
        }
    }
    // Aggregate Facebook
    const fbTotalLikes = fbPosts.reduce((s, p) => s + p.likes, 0);
    const fbTotalComments = fbPosts.reduce((s, p) => s + p.comments, 0);
    const fbTotalShares = fbPosts.reduce((s, p) => s + p.shares, 0);
    const fbTotalEngagement = fbTotalLikes + fbTotalComments + fbTotalShares;
    // Aggregate Instagram
    const igTotalLikes = igPosts.reduce((s, p) => s + p.likes, 0);
    const igTotalComments = igPosts.reduce((s, p) => s + p.comments, 0);
    const igTotalShares = igPosts.reduce((s, p) => s + p.shares, 0);
    const igTotalEngagement = igTotalLikes + igTotalComments + igTotalShares;
    // Combined
    const allPosts = [...fbPosts, ...igPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const totalEngagement = fbTotalEngagement + igTotalEngagement;
    const totalPosts = allPosts.length;
    // Engagement by day
    const dayMap = new Map();
    for (const post of allPosts) {
        const day = post.publishedAt.slice(0, 10);
        const existing = dayMap.get(day) || { engagement: 0, likes: 0, comments: 0, shares: 0 };
        existing.engagement += post.engagement;
        existing.likes += post.likes;
        existing.comments += post.comments;
        existing.shares += post.shares;
        dayMap.set(day, existing);
    }
    const engagementByDay = [...dayMap.entries()]
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    // Top posts by engagement
    const topPosts = [...allPosts]
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);
    return {
        clientId,
        pageId: pageConnection.pageId,
        pageName: pageConnection.pageName,
        lastFetched: new Date().toISOString(),
        period: targetPeriod,
        warnings: facebookWarning || instagramWarning
            ? { facebook: facebookWarning, instagram: instagramWarning }
            : undefined,
        facebook: {
            posts: fbPosts,
            totalLikes: fbTotalLikes,
            totalComments: fbTotalComments,
            totalShares: fbTotalShares,
            totalEngagement: fbTotalEngagement,
            avgEngagement: fbPosts.length ? Math.round(fbTotalEngagement / fbPosts.length) : 0,
        },
        instagram: {
            posts: igPosts,
            totalLikes: igTotalLikes,
            totalComments: igTotalComments,
            totalShares: igTotalShares,
            totalEngagement: igTotalEngagement,
            avgEngagement: igPosts.length ? Math.round(igTotalEngagement / igPosts.length) : 0,
        },
        combined: {
            totalPosts,
            totalLikes: fbTotalLikes + igTotalLikes,
            totalComments: fbTotalComments + igTotalComments,
            totalShares: fbTotalShares + igTotalShares,
            totalEngagement: totalEngagement,
            avgEngagement: totalPosts ? Math.round(totalEngagement / totalPosts) : 0,
            engagementByDay,
            topPosts,
        },
    };
}
const REPORTS_FILE = resolve(import.meta.dirname, '..', 'data', 'reports.json');
export function readReports() {
    try {
        if (existsSync(REPORTS_FILE)) {
            return JSON.parse(readFileSync(REPORTS_FILE, 'utf-8'));
        }
    }
    catch { /* ignore */ }
    return [];
}
export function writeReports(reports) {
    writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
}
