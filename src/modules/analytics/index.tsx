import { BarChart3, Activity, FileText, Clock, Palette, Brain, Link2 } from 'lucide-react'
import { AnalyticsOverview } from './components/AnalyticsOverview'
import { PostPerformance } from './components/PostPerformance'
import { MonthlyReport } from './components/MonthlyReport'
import { SmartScheduling } from './components/SmartScheduling'
import { WhiteLabelConfig } from './components/WhiteLabelConfig'
import { AIInsights } from './components/AIInsights'
import { RevenueAttribution } from './components/RevenueAttribution'
import type { AppModule } from '../registry'

export const analyticsModule: AppModule = {
  id: 'analytics',
  name: 'Analytics',
  navSection: 'main',
  navItems: [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsOverview },
    { id: 'performance', label: 'Performance', icon: Activity, component: PostPerformance },
    { id: 'attribution', label: 'Attribution', icon: Link2, component: RevenueAttribution },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain, component: AIInsights },
    { id: 'best-times', label: 'Best Times', icon: Clock, component: SmartScheduling },
    { id: 'reports', label: 'Reports', icon: FileText, component: MonthlyReport },
    { id: 'white-label', label: 'White-Label', icon: Palette, component: WhiteLabelConfig },
  ],
}
