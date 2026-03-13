import { Image } from 'lucide-react'
import { MediaLibrary } from './components/MediaLibrary'
import type { AppModule } from '../registry'

export const mediaLibraryModule: AppModule = {
  id: 'media-library',
  name: 'Media',
  navSection: 'main',
  navItems: [
    { id: 'media', label: 'Media', icon: Image, component: MediaLibrary },
  ],
}
