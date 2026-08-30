import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

import App from './App.tsx'

import './styles/global.css'
import './App.css'

const updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent('pwa-update-available')
    )
  },

  onOfflineReady() {
    window.dispatchEvent(
      new CustomEvent('pwa-offline-ready')
    )
  },
})

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <App updateSW={updateSW}/>
  </StrictMode>,
)