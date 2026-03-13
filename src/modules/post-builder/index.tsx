import { PenTool } from 'lucide-react'
import { PostBuilder } from './components/PostBuilder'
import type { AppModule } from '../registry'

export const postBuilderModule: AppModule = {
  id: 'post-builder',
  name: 'Design',
  navSection: 'main',
  navItems: [
    { id: 'designer', label: 'Designer', icon: PenTool, component: PostBuilder },
  ],
}
