import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './dark.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)

// Hide the preloader once the app has rendered. It stays at least ~1.1s on the first visit of a
// session (so the animation reads as intentional) and only briefly on later navigations/reloads.
;(() => {
  const el = document.getElementById('sa-preloader')
  if (!el) return
  let first = true
  try { first = !sessionStorage.getItem('sa_loaded'); sessionStorage.setItem('sa_loaded', '1') } catch { /* storage blocked */ }
  const minMs = first ? 1100 : 250
  const started = performance.now()
  const hide = () => {
    const wait = Math.max(0, minMs - (performance.now() - started))
    setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 700) }, wait)
  }
  if (document.readyState === 'complete') requestAnimationFrame(hide)
  else window.addEventListener('load', hide, { once: true })
  setTimeout(hide, 4000) // never block longer than this
})()
