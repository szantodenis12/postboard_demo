import { LayoutDashboard, CalendarDays, Kanban, Building2 } from 'lucide-react'
import { Dashboard } from './components/Dashboard'
import { CalendarView } from './components/CalendarView'
import { KanbanView } from './components/KanbanView'
import { AgencyDashboard } from './components/AgencyDashboard'
import type { AppModule } from '../registry'

export const contentPlannerModule: AppModule = {
  id: 'content-planner',
  name: 'Content',
  navSection: 'main',
  navItems: [
    { id: 'agency', label: 'Agency', icon: Building2, component: AgencyDashboard },
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, component: Dashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays, component: CalendarView },
    { id: 'kanban', label: 'Board', icon: Kanban, component: KanbanView },
  ],
}
