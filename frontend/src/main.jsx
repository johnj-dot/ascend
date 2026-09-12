import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Activate Service Worker immediately for offline access and background notifications
registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {
    console.log('Ascend offline ready');
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
