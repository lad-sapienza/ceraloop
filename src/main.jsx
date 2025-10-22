import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './styles.css'

// Handle redirect from 404.html
function RedirectHandler({ children }) {
  const navigate = useNavigate()
  
  React.useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath')
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath')
      navigate(redirectPath, { replace: true })
    }
  }, [navigate])
  
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <RedirectHandler>
          <App />
        </RedirectHandler>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
