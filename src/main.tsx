import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { initServiceWorker } from './lib/push'
import { initSfx } from './lib/sfx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)

// unlock mobile audio on first gesture; keep the push SW warm if opted in
initSfx()
void initServiceWorker()
