import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FontScaleProvider } from './context/FontScaleContext'
import { AccentColorProvider } from './context/AccentColorContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FontScaleProvider>
      <AccentColorProvider>
        <App />
      </AccentColorProvider>
    </FontScaleProvider>
  </StrictMode>,
)
