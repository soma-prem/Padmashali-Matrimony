import { useEffect, useState } from 'react'
import { onToast } from '../api/api.js'

/**
 * Global toasts. Anything using toast.success() / toast.error()
 * from api.js shows up here (success / error styling).
 */
export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const off = onToast(({ kind, text, key }) => {
      setToasts((list) => [...list, { kind, text, key }])
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.key !== key))
      }, 3600)
    })
    return off
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.key} className={`toast toast--${t.kind}`}>
          {t.kind === 'success' ? '✔ ' : '✖ '}
          {t.text}
        </div>
      ))}
    </div>
  )
}
