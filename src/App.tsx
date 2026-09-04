import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'

export default function App() {
  return (
    <>
      <PWAUpdatePrompt />

      <RouterProvider router={router} />
    </>
  )
}