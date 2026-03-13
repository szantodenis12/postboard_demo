import { Megaphone, Sparkles, DollarSign } from 'lucide-react'
import { CampaignList } from './components/CampaignList'
import { AdCopyLab } from './components/AdCopyLab'
import { SpendTracker } from './components/SpendTracker'
import type { AppModule } from '../registry'

export const adsManagerModule: AppModule = {
  id: 'ads-manager',
  name: 'Ads',
  navSection: 'main',
  navItems: [
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, component: CampaignList },
    { id: 'adcopy', label: 'Ad Copy Lab', icon: Sparkles, component: AdCopyLab },
    { id: 'spend', label: 'Spend Tracker', icon: DollarSign, component: SpendTracker },
  ],
}
