import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import './styles/global.css'
import './App.css'

export default function App() {
  return <RouterProvider router={router} />
}
