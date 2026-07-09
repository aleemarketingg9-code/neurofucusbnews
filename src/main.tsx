import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initServiceWorker } from './registerSW'
import { applyTheme, getStoredTheme } from './lib/theme'
import { ThemeProvider } from './lib/useTheme'

// Apply the persisted theme choice synchronously, before the first paint, so
// there's no flash of the wrong theme on load.
applyTheme(getStoredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)

initServiceWorker()
