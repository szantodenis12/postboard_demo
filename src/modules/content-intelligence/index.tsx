import { Brain, Repeat, Eye, Lightbulb, Rocket, Recycle } from 'lucide-react'
import { AIStudio } from './components/AIStudio'
import { RepurposeEngine } from './components/RepurposeEngine'
import { CompetitorMonitor } from './components/CompetitorMonitor'
import { SmartSuggestions } from './components/SmartSuggestions'
import { ContentPipeline } from './components/ContentPipeline'
import { ContentRecycler } from './components/ContentRecycler'
import type { AppModule } from '../registry'

// Wrapper components that provide clientId from context
import { useApp } from '../../core/context'

function RepurposeView() {
  const { data, selectedClient } = useApp()
  const clientId = selectedClient || data.clients[0]?.id || ''
  return <RepurposeEngine clientId={clientId} />
}

function CompetitorView() {
  const { data, selectedClient } = useApp()
  const clientId = selectedClient || data.clients[0]?.id || ''
  return <CompetitorMonitor clientId={clientId} />
}

function SmartSuggestionsView() {
  const { data, selectedClient } = useApp()
  const clientId = selectedClient || data.clients[0]?.id || ''
  return <SmartSuggestions clientId={clientId} />
}

function ContentRecyclerView() {
  const { data, selectedClient } = useApp()
  const clientId = selectedClient || data.clients[0]?.id || ''
  return <ContentRecycler clientId={clientId} />
}

export const contentIntelligenceModule: AppModule = {
  id: 'content-intelligence',
  name: 'AI',
  navSection: 'main',
  navItems: [
    { id: 'content-pipeline', label: 'Content Pipeline', icon: Rocket, component: ContentPipeline },
    { id: 'ai-studio', label: 'AI Studio', icon: Brain, component: AIStudio },
    { id: 'smart-suggestions', label: 'Smart Suggestions', icon: Lightbulb, component: SmartSuggestionsView },
    { id: 'content-recycler', label: 'Content Recycler', icon: Recycle, component: ContentRecyclerView },
    { id: 'repurpose', label: 'Repurpose', icon: Repeat, component: RepurposeView },
    { id: 'competitors', label: 'Competitors', icon: Eye, component: CompetitorView },
  ],
}
