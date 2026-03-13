import { Users, GitBranch, BarChart3 } from 'lucide-react'
import { TeamMembers } from './components/TeamMembers'
import { WorkflowBoard } from './components/WorkflowBoard'
import { WorkloadView } from './components/WorkloadView'
import type { AppModule } from '../registry'

export const teamWorkflowModule: AppModule = {
  id: 'team-workflow',
  name: 'Team',
  navSection: 'main',
  navItems: [
    { id: 'team-members', label: 'Team', icon: Users, component: TeamMembers },
    { id: 'workflow-board', label: 'Workflow', icon: GitBranch, component: WorkflowBoard },
    { id: 'workload', label: 'Workload', icon: BarChart3, component: WorkloadView },
  ],
}
