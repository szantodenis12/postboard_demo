import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useData } from './hooks/useData'
import { useMeta } from './hooks/useMeta'
import { useNotifications } from './hooks/useNotifications'
import { usePostImages } from './hooks/usePostImages'
import type {
  DashboardData,
  PostStatus,
  MetaStatus,
  PageMapping,
  PublishConfig,
  AppNotification,
  PostMediaItem,
  PublishMediaPayload,
  InstagramPublishPayload,
  PostPublishOptions,
} from './types'

const EMPTY_DATA: DashboardData = {
  clients: [],
  totals: { clients: 0, posts: 0, draft: 0, approved: 0, scheduled: 0, published: 0 },
}

interface AppContextValue {
  // Data
  data: DashboardData
  loading: boolean
  error: string | null
  refresh: () => void
  updatePostStatus: (postId: string, status: PostStatus) => void
  updatePostCaption: (postId: string, caption: string, hashtags: string[]) => void
  updatePostDate: (postId: string, date: string) => void
  updatePostPublishOptions: (postId: string, options: PostPublishOptions) => Promise<boolean>
  deletePost: (postId: string) => void
  createPost: (postData: any) => Promise<any>

  // Meta
  meta: MetaStatus
  pageMapping: PageMapping
  metaLoading: boolean
  connectMeta: () => void
  disconnectMeta: () => Promise<void>
  refreshMeta: () => void
  setPageMapping: (clientId: string, pageId: string | null) => void
  getPublishConfig: (clientId: string) => PublishConfig | null
  publishToFacebook: (pageId: string, message: string, media?: PublishMediaPayload) => Promise<any>
  publishToInstagram: (pageId: string, caption: string, media: InstagramPublishPayload) => Promise<any>

  // Post images
  getImageUrl: (postId: string) => string | null
  getPostMedia: (postId: string) => PostMediaItem[]
  hasPostMedia: (postId: string) => boolean
  refreshImages: () => void

  // Notifications
  notifications: AppNotification[]
  unreadCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Global content filters
  showExpiredPosts: boolean
  setShowExpiredPosts: (value: boolean) => void

  // Client selection
  selectedClient: string | null
  setSelectedClient: (id: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)
const SHOW_EXPIRED_STORAGE_KEY = 'postboard.showExpiredPosts'

export function AppProvider({ children }: { children: ReactNode }) {
  const [showExpiredPosts, setShowExpiredPosts] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SHOW_EXPIRED_STORAGE_KEY) === '1'
  })
  const { data, loading, error, refresh, updatePostStatus, updatePostCaption, updatePostDate, updatePostPublishOptions, deletePost, createPost } = useData({
    includeExpired: showExpiredPosts,
  })
  const metaHook = useMeta()
  const notifHook = useNotifications()
  const imageHook = usePostImages()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SHOW_EXPIRED_STORAGE_KEY, showExpiredPosts ? '1' : '0')
  }, [showExpiredPosts])

  const value: AppContextValue = {
    data,
    loading,
    error,
    refresh,
    updatePostStatus,
    updatePostCaption,
    updatePostDate,
    updatePostPublishOptions,
    deletePost,
    createPost,
    meta: metaHook.meta,
    pageMapping: metaHook.pageMapping,
    metaLoading: metaHook.loading,
    connectMeta: metaHook.connect,
    disconnectMeta: metaHook.disconnect,
    refreshMeta: metaHook.refresh,
    setPageMapping: metaHook.setPageMapping,
    getPublishConfig: metaHook.getPublishConfig,
    publishToFacebook: metaHook.publishToFacebook,
    publishToInstagram: metaHook.publishToInstagram,
    getImageUrl: imageHook.getImageUrl,
    getPostMedia: imageHook.getPostMedia,
    hasPostMedia: imageHook.hasPostMedia,
    refreshImages: imageHook.refreshImages,
    notifications: notifHook.notifications,
    unreadCount: notifHook.unreadCount,
    markNotificationRead: notifHook.markRead,
    markAllNotificationsRead: notifHook.markAllRead,
    showExpiredPosts,
    setShowExpiredPosts,
    selectedClient,
    setSelectedClient,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
