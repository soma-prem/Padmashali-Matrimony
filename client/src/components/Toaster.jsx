import { useEffect, useRef, useState } from 'react'
import { onToast } from '../api/api.js'

/**
 * Global toasts. Anything using toast.success() / toast.error()
 * from api.js shows up here (success / error styling).
 */
export default function Toaster() {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  useEffect(() => {
    const off = onToast(({ kind, text, key, duration = 4000 }) => {
      setToasts((list) => [...list, { kind, text, key }])
      const timer = setTimeout(() => {
        setToasts((list) => list.filter((t) => t.key !== key))
        timers.current.delete(key)
      }, duration)
      timers.current.set(key, timer)
    })
    return () => {
      off()
      timers.current.forEach((timer) => clearTimeout(timer))
      timers.current.clear()
    }
  }, [])

  const dismiss = (key) => {
    clearTimeout(timers.current.get(key))
    timers.current.delete(key)
    setToasts((list) => list.filter((toast) => toast.key !== key))
  }

  if (toasts.length === 0) return null

  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.key} className={`toast toast--${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          <span className="toast-content">
            <span className="toast-icon" aria-hidden="true">{t.kind === 'success' ? '✓' : '!'}</span>
            <span>{t.text}</span>
          </span>
          <button type="button" className="toast-close" aria-label="Dismiss notification"
            onClick={() => dismiss(t.key)}>×</button>
        </div>
      ))}
    </div>
  )
}
