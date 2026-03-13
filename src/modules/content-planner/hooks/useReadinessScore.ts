import { useMemo } from 'react'
import type { Post, Platform, PostFormat } from '../../../core/types'

// ── Types ────────────────────────────────────────────────

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface Factor {
  name: string
  score: number
  maxScore: number
  tip?: string
}

export interface ReadinessResult {
  score: number
  grade: Grade
  factors: Factor[]
}

// ── Grade thresholds & colors ────────────────────────────

export const GRADE_COLORS: Record<Grade, string> = {
  A: '#10b981', // green
  B: '#3b82f6', // blue
  C: '#eab308', // yellow
  D: '#f97316', // orange
  F: '#ef4444', // red
}

function toGrade(score: number): Grade {
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

// ── CTA phrases ─────────────────────────────────────────

const CTA_PHRASES = [
  'click', 'share', 'comment', 'link in bio', 'save', 'follow',
  'tag', 'like', 'dm', 'swipe', 'tap', 'subscribe', 'join',
  'register', 'sign up', 'buy', 'shop', 'order', 'book',
  'learn more', 'discover', 'check out', 'visit', 'download',
  // Romanian equivalents
  'dă click', 'distribuie', 'comentează', 'link în bio', 'salvează',
  'urmărește', 'etichetează', 'apasă', 'abonează', 'înscrie',
  'comandă', 'cumpără', 'descoperă', 'vizitează', 'descarcă',
  'scrie-ne', 'contactează', 'programează', 'rezervă',
]

// ── Platform caption ranges ─────────────────────────────

const CAPTION_RANGES: Record<Platform, { min: number; ideal_min: number; ideal_max: number }> = {
  instagram:  { min: 30, ideal_min: 100, ideal_max: 2200 },
  facebook:   { min: 30, ideal_min: 40,  ideal_max: 500 },
  tiktok:     { min: 30, ideal_min: 50,  ideal_max: 300 },
  linkedin:   { min: 30, ideal_min: 50,  ideal_max: 700 },
  google:     { min: 30, ideal_min: 30,  ideal_max: 300 },
  stories:    { min: 10, ideal_min: 10,  ideal_max: 200 },
}

// ── Hashtag ideal ranges per platform ───────────────────

const HASHTAG_RANGES: Record<Platform, { ideal_min: number; ideal_max: number; ok_min: number; ok_max: number }> = {
  instagram:  { ideal_min: 5, ideal_max: 15, ok_min: 1, ok_max: 30 },
  facebook:   { ideal_min: 0, ideal_max: 3,  ok_min: 0, ok_max: 5 },
  tiktok:     { ideal_min: 3, ideal_max: 8,  ok_min: 1, ok_max: 15 },
  linkedin:   { ideal_min: 3, ideal_max: 5,  ok_min: 1, ok_max: 10 },
  google:     { ideal_min: 0, ideal_max: 0,  ok_min: 0, ok_max: 3 },
  stories:    { ideal_min: 0, ideal_max: 5,  ok_min: 0, ok_max: 10 },
}

// ── Platform-format norms ───────────────────────────────

const PLATFORM_BEST_FORMATS: Record<Platform, PostFormat[]> = {
  instagram:  ['single-image', 'carousel', 'reel', 'stories'],
  facebook:   ['single-image', 'carousel', 'video', 'text'],
  tiktok:     ['reel', 'video'],
  linkedin:   ['text', 'single-image', 'carousel', 'video'],
  google:     ['single-image', 'text'],
  stories:    ['stories'],
}

const PLATFORM_GOOD_FORMATS: Record<Platform, PostFormat[]> = {
  instagram:  ['video'],
  facebook:   ['reel', 'stories'],
  tiktok:     ['single-image'],
  linkedin:   ['stories'],
  google:     ['video'],
  stories:    ['single-image', 'video'],
}

// ── Formats that visually require an image ──────────────

const IMAGE_REQUIRED_FORMATS: PostFormat[] = [
  'single-image', 'carousel', 'reel', 'video', 'stories',
]

// ── Scoring functions ───────────────────────────────────

function scoreCaptionQuality(post: Post): Factor {
  const MAX = 25
  const len = post.caption.length
  const range = CAPTION_RANGES[post.platform] || CAPTION_RANGES.facebook
  const captionLower = post.caption.toLowerCase()

  let points = 0

  // Length scoring (15 pts)
  if (len < range.min) {
    // Too short
    points += 0
  } else if (len >= range.ideal_min && len <= range.ideal_max) {
    points += 15
  } else if (len < range.ideal_min) {
    // Between min and ideal_min — partial
    const ratio = (len - range.min) / Math.max(1, range.ideal_min - range.min)
    points += Math.round(ratio * 10)
  } else {
    // Longer than ideal — slight penalty
    points += 10
  }

  // CTA presence (10 pts)
  const hasCta = CTA_PHRASES.some(phrase => captionLower.includes(phrase))
  if (hasCta) {
    points += 10
  }

  const tip = points < MAX
    ? len < range.min
      ? `Caption is too short (${len} chars). Aim for ${range.ideal_min}-${range.ideal_max} chars.`
      : len > range.ideal_max
        ? `Caption is very long (${len} chars). Consider trimming to under ${range.ideal_max} chars.`
        : !hasCta
          ? 'Add a call-to-action phrase (e.g., "comment", "save", "link in bio").'
          : `Aim for ${range.ideal_min}-${range.ideal_max} chars with a clear CTA.`
    : undefined

  return { name: 'Caption quality', score: Math.min(points, MAX), maxScore: MAX, tip }
}

function scoreHashtags(post: Post): Factor {
  const MAX = 15
  const count = post.hashtags.length
  const range = HASHTAG_RANGES[post.platform] || HASHTAG_RANGES.facebook

  let points = 0

  if (count >= range.ideal_min && count <= range.ideal_max) {
    points = 15
  } else if (count >= range.ok_min && count <= range.ok_max) {
    points = 10
  } else if (count === 0 && range.ideal_min === 0) {
    points = 15 // Platform doesn't need hashtags
  } else {
    points = 0
  }

  const tip = points < MAX
    ? count === 0 && range.ideal_min > 0
      ? `Add hashtags. Ideal for ${post.platform}: ${range.ideal_min}-${range.ideal_max}.`
      : count > range.ideal_max
        ? `Too many hashtags (${count}). Ideal for ${post.platform}: ${range.ideal_min}-${range.ideal_max}.`
        : count < range.ideal_min
          ? `Add more hashtags (${count} now). Ideal for ${post.platform}: ${range.ideal_min}-${range.ideal_max}.`
          : undefined
    : undefined

  return { name: 'Hashtags', score: Math.min(points, MAX), maxScore: MAX, tip }
}

function scoreImage(hasImage: boolean, post: Post): Factor {
  const MAX = 20
  const needsImage = IMAGE_REQUIRED_FORMATS.includes(post.format)

  if (hasImage) {
    return { name: 'Image attached', score: MAX, maxScore: MAX }
  }

  if (needsImage) {
    return {
      name: 'Image attached',
      score: 0,
      maxScore: MAX,
      tip: `A ${post.format} post needs a visual. Attach an image or video.`,
    }
  }

  // Text post without image — partial credit
  return { name: 'Image attached', score: 10, maxScore: MAX, tip: 'Adding a visual can boost engagement.' }
}

function scoreScheduling(post: Post): Factor {
  const MAX = 15
  let points = 0
  const tips: string[] = []

  // Has date (5 pts)
  if (post.date) {
    points += 5
  } else {
    tips.push('Set a publish date.')
  }

  // Has time (5 pts)
  if (post.time) {
    points += 5

    // Optimal hours (5 pts): 9-12 or 17-20
    const hour = parseInt(post.time.split(':')[0], 10)
    if ((hour >= 9 && hour <= 12) || (hour >= 17 && hour <= 20)) {
      points += 5
    } else {
      tips.push('Best posting hours: 9:00-12:00 or 17:00-20:00.')
    }
  } else {
    tips.push('Set a specific posting time.')
  }

  return {
    name: 'Scheduling',
    score: Math.min(points, MAX),
    maxScore: MAX,
    tip: tips.length > 0 ? tips.join(' ') : undefined,
  }
}

function scoreCompleteness(post: Post): Factor {
  const MAX = 15
  let points = 0
  const missing: string[] = []

  if (post.visualDescription) {
    points += 5
  } else {
    missing.push('visual description')
  }

  if (post.cta) {
    points += 5
  } else {
    missing.push('CTA field')
  }

  if (post.pillar) {
    points += 5
  } else {
    missing.push('content pillar')
  }

  return {
    name: 'Content completeness',
    score: points,
    maxScore: MAX,
    tip: missing.length > 0 ? `Add: ${missing.join(', ')}.` : undefined,
  }
}

function scorePlatformOptimization(post: Post): Factor {
  const MAX = 10
  const best = PLATFORM_BEST_FORMATS[post.platform] || []
  const good = PLATFORM_GOOD_FORMATS[post.platform] || []

  if (best.includes(post.format)) {
    return { name: 'Platform fit', score: MAX, maxScore: MAX }
  }

  if (good.includes(post.format)) {
    return { name: 'Platform fit', score: 6, maxScore: MAX }
  }

  return {
    name: 'Platform fit',
    score: 2,
    maxScore: MAX,
    tip: `${post.format} is not ideal for ${post.platform}. Best formats: ${best.join(', ')}.`,
  }
}

// ── Main hook ───────────────────────────────────────────

export function useReadinessScore(post: Post, hasImage: boolean): ReadinessResult {
  return useMemo(() => {
    const factors: Factor[] = [
      scoreCaptionQuality(post),
      scoreHashtags(post),
      scoreImage(hasImage, post),
      scoreScheduling(post),
      scoreCompleteness(post),
      scorePlatformOptimization(post),
    ]

    const score = factors.reduce((sum, f) => sum + f.score, 0)
    const grade = toGrade(score)

    return { score, grade, factors }
  }, [
    post.caption,
    post.hashtags,
    post.platform,
    post.format,
    post.date,
    post.time,
    post.visualDescription,
    post.cta,
    post.pillar,
    hasImage,
  ])
}

// ── Standalone compute (for non-hook contexts) ──────────

export function computeReadinessScore(post: Post, hasImage: boolean): ReadinessResult {
  const factors: Factor[] = [
    scoreCaptionQuality(post),
    scoreHashtags(post),
    scoreImage(hasImage, post),
    scoreScheduling(post),
    scoreCompleteness(post),
    scorePlatformOptimization(post),
  ]

  const score = factors.reduce((sum, f) => sum + f.score, 0)
  const grade = toGrade(score)

  return { score, grade, factors }
}
