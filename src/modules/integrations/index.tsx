import { Plug, Webhook, Timer, Workflow } from 'lucide-react'
import { IntegrationsHub } from './components/IntegrationsHub'
import { WebhookManager } from './components/WebhookManager'
import { AutoScheduler } from './components/AutoScheduler'
import { SmartQueue } from './components/SmartQueue'
import type { AppModule } from '../registry'

export const integrationsModule: AppModule = {
  id: 'integrations',
  name: 'Integrations',
  navSection: 'main',
  navItems: [
    { id: 'integrations', label: 'Integrations', icon: Plug, component: IntegrationsHub },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, component: WebhookManager },
    { id: 'scheduler', label: 'Auto-Publish', icon: Timer, component: AutoScheduler },
    { id: 'smart-queue', label: 'Smart Queue', icon: Workflow, component: SmartQueue },
  ],
}
