import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import './styles/navbar.css'
import './styles/footer.css'
import './styles/home.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/profile.css'
import './styles/admin.css'
import './styles/notifications.css'
import './styles/browse.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
