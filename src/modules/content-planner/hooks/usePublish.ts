import { useCallback } from 'react'
import { useApp } from '../../../core/context'
import { absoluteAssetUrl } from '../../../core/config'
import { useToast } from '../../../core/ui/ToastProvider'
import type { Post, PostMediaItem, PostStatus, PublishMediaPayload, InstagramPublishPayload } from '../../../core/types'

function resolveFacebookPublishMedia(post: Post, media: PostMediaItem[]): PublishMediaPayload | null | undefined {
  const firstVideo = media.find(item => item.type === 'video')
  const firstImage = media.find(item => item.type === 'image')

  if (post.format === 'video' || post.format === 'reel') {
    if (firstVideo) {
      const url = absoluteAssetUrl(firstVideo.url)
      if (url) return { type: 'video', url }
    }
    return null
  }

  if (firstImage) {
    const url = absoluteAssetUrl(firstImage.url)
    if (url) return { type: 'image', url }
  }

  return undefined
}

function resolveInstagramPublishMedia(post: Post, media: PostMediaItem[]): InstagramPublishPayload | null {
  const visualItems = media.filter(item => item.type === 'image' || item.type === 'video')
  const firstVideo = media.find(item => item.type === 'video')
  const firstImage = media.find(item => item.type === 'image')

  if (post.format === 'stories') {
    if (visualItems.length !== 1) return null
    const storyMedia = visualItems[0]
    const url = absoluteAssetUrl(storyMedia.url)
    if (!url) return null
    return { type: 'story', media: { type: storyMedia.type, url } }
  }

  if (post.format === 'carousel') {
    if (visualItems.length < 2 || visualItems.length > 10) return null
    const items = visualItems.map(item => {
      const url = absoluteAssetUrl(item.url)
      return url ? { type: item.type, url } : null
    }).filter(Boolean) as PublishMediaPayload[]
    if (items.length !== visualItems.length) return null
    return { type: 'carousel', items }
  }

  if (post.format === 'video') {
    if (firstVideo) {
      const url = absoluteAssetUrl(firstVideo.url)
      if (url) return { type: 'video', url, shareToFeed: true }
    }
    return null
  }

  if (post.format === 'reel') {
    if (firstVideo) {
      const url = absoluteAssetUrl(firstVideo.url)
      if (url) return { type: 'video', url, shareToFeed: false }
    }
    return null
  }

  if (firstImage) {
    const url = absoluteAssetUrl(firstImage.url)
    if (url) return { type: 'image', url }
  }

  return null
}

export function usePublish() {
  const { data, getPublishConfig, publishToFacebook, publishToInstagram, updatePostStatus } = useApp()
  const { toast } = useToast()

  return useCallback(async (postId: string, platform: 'facebook' | 'instagram', caption: string) => {
    let clientId: string | null = null
    let targetPost: Post | null = null
    for (const client of data.clients) {
      const post = client.posts.find(p => p.id === postId)
      if (post) {
        clientId = post.clientId
        targetPost = post
        break
      }
    }
    if (!clientId) return { success: false, error: 'Post not found' }

    const config = getPublishConfig(clientId)
    if (!config) return { success: false, error: 'No Meta page mapped for this client' }

    let postMedia: PostMediaItem[] = []
    try {
      const mediaRes = await fetch('/api/post-media')
      const media = await mediaRes.json() as Record<string, PostMediaItem[]>
      postMedia = media[postId] || []
    } catch { /* ignore */ }

    let result: any
    if (platform === 'facebook') {
      const media = targetPost ? resolveFacebookPublishMedia(targetPost, postMedia) : undefined
      if (media === null) {
        return {
          success: false,
          error: 'Postarea Facebook de tip video are nevoie de un video atașat',
        }
      }
      result = await publishToFacebook(config.pageId, caption, media)
    } else {
      if (targetPost?.requiresInstagramMusic) {
        return {
          success: false,
          error: 'Postarea este setată cu muzică Instagram și trebuie publicată manual din aplicația Instagram',
        }
      }
      const media = targetPost ? resolveInstagramPublishMedia(targetPost, postMedia) : null
      if (!media) {
        const carouselCount = postMedia.filter(item => item.type === 'image' || item.type === 'video').length
        return {
          success: false,
          error: targetPost?.format === 'video' || targetPost?.format === 'reel'
            ? 'Postarea Instagram de tip video are nevoie de un video atașat'
            : targetPost?.format === 'stories'
              ? (carouselCount > 1
                  ? 'Story-ul Instagram acceptă exact 1 imagine sau 1 video atașat'
                  : 'Story-ul Instagram are nevoie de 1 imagine sau 1 video atașat')
            : targetPost?.format === 'carousel'
              ? (carouselCount > 10
                  ? 'Caruselul Instagram acceptă maximum 10 media atașate'
                  : 'Caruselul Instagram are nevoie de cel puțin 2 media atașate')
              : 'Postarea selectată nu are încă o imagine atașată pentru Instagram',
        }
      }
      result = await publishToInstagram(config.pageId, caption, media)
    }

    if (result.success) {
      updatePostStatus(postId, 'published' as PostStatus)
      toast('success', `Published to ${platform === 'facebook' ? 'Facebook' : 'Instagram'}`)
    } else {
      toast('error', result.error || 'Publish failed')
    }

    return result
  }, [data.clients, getPublishConfig, publishToFacebook, publishToInstagram, updatePostStatus, toast])
}
