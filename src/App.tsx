import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import './styles/global.css'
import './App.css'

interface AppProps {
  updateSW: (reloadPage?: boolean) => Promise<void>
}

export default function App({ updateSW }: AppProps) {
  return(
    <>
      <PWAUpdatePrompt updateSW={updateSW} />
      <RouterProvider router={router} />
    </>
  )
}
