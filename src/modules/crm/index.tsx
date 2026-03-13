import { Users, ListTodo, Receipt, Calculator, UserPlus } from 'lucide-react'
import { ClientProfiles } from './components/ClientProfiles'
import { TaskTracker } from './components/TaskTracker'
import { BillingTracker } from './components/BillingTracker'
import { ROICalculator } from './components/ROICalculator'
import { OnboardingWizard } from './components/OnboardingWizard'
import type { AppModule } from '../registry'

export const crmModule: AppModule = {
  id: 'crm',
  name: 'CRM',
  navSection: 'main',
  navItems: [
    { id: 'crm-clients', label: 'Clients', icon: Users, component: ClientProfiles },
    { id: 'crm-tasks', label: 'Tasks', icon: ListTodo, component: TaskTracker },
    { id: 'crm-billing', label: 'Billing', icon: Receipt, component: BillingTracker },
    { id: 'crm-roi', label: 'ROI', icon: Calculator, component: ROICalculator },
    { id: 'crm-onboard', label: 'Onboard', icon: UserPlus, component: OnboardingWizard },
  ],
}
