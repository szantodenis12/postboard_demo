import { Link2, MessageSquareText, Timer } from 'lucide-react'
import { ReviewLinks } from './components/ReviewLinks'
import { FeedbackView } from './components/FeedbackView'
import { ApprovalTracker } from './components/ApprovalTracker'
import type { AppModule } from '../registry'

export const clientPortalModule: AppModule = {
  id: 'client-portal',
  name: 'Portal',
  navSection: 'main',
  navItems: [
    { id: 'review-links', label: 'Review Links', icon: Link2, component: ReviewLinks },
    { id: 'feedback', label: 'Feedback', icon: MessageSquareText, component: FeedbackView },
    { id: 'approval-tracker', label: 'Approval Tracker', icon: Timer, component: ApprovalTracker },
  ],
}
