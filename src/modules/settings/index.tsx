import { Settings } from 'lucide-react'
import { SettingsView } from './components/SettingsView'
import type { AppModule } from '../registry'

export const settingsModule: AppModule = {
  id: 'settings',
  name: 'Settings',
  navSection: 'bottom',
  navItems: [
    { id: 'settings', label: 'Settings', icon: Settings, component: SettingsView },
  ],
}
