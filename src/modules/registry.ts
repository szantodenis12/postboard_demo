import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  component: ComponentType
}

export interface AppModule {
  id: string
  name: string
  navSection: 'main' | 'bottom'
  navItems: NavItem[]
}

// Module imports — add new modules here
import { contentPlannerModule } from './content-planner'
import { contentIntelligenceModule } from './content-intelligence'
import { postBuilderModule } from './post-builder'
import { mediaLibraryModule } from './media-library'
import { analyticsModule } from './analytics'
import { adsManagerModule } from './ads-manager'
import { clientPortalModule } from './client-portal'
import { crmModule } from './crm'
import { integrationsModule } from './integrations'
import { teamWorkflowModule } from './team-workflow'
import { settingsModule } from './settings'

export const modules: AppModule[] = [
  contentPlannerModule,
  contentIntelligenceModule,
  postBuilderModule,
  mediaLibraryModule,
  analyticsModule,
  adsManagerModule,
  clientPortalModule,
  crmModule,
  integrationsModule,
  teamWorkflowModule,
  settingsModule,
]

// Flat lookup: viewId → component
export function getViewComponent(viewId: string): ComponentType | null {
  for (const mod of modules) {
    const item = mod.navItems.find(n => n.id === viewId)
    if (item) return item.component
  }
  return null
}

export const defaultViewId = modules[0]?.navItems[0]?.id ?? 'dashboard'
