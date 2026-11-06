import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PhotoPreview({ src, alt = 'Photo', className = '', style }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="admin-photo-preview-trigger"
        onClick={() => setOpen(true)}
        aria-label={`Open full-screen preview: ${alt}`}
      >
        <img src={src} alt={alt} className={className} style={style} />
      </button>
      {open && createPortal(
        <div
          className="admin-photo-preview"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} full-screen preview`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <button
            type="button"
            className="admin-photo-preview-close"
            onClick={() => setOpen(false)}
            aria-label="Close photo preview"
            autoFocus
          >
            ×
          </button>
          <img src={src} alt={alt} className="admin-photo-preview-image" />
        </div>,
        document.body,
      )}
    </>
  )
}
