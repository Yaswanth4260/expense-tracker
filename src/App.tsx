import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'

import './styles/global.css'
import './App.css'

export default function App() {
  return (
    <>
      <PWAUpdatePrompt />

      <RouterProvider router={router} />
    </>
  )
}