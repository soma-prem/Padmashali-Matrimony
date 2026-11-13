import { useEffect, useState } from 'react'
import { api, apiUpload, toast } from '../../api/api.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function StepPhotos({ profile = {}, onProfileReplace, disabled }) {
  const { t } = useLanguage()
  const photos = profile.photos || []
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
  }, [preview?.url])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 6) {
      toast.error(t('You can upload up to 6 photos.'))
      e.target.value = ''
      return
    }
    const url = URL.createObjectURL(file)
    setPreview({ url, name: file.name, ready: false })
    setUploading(true)
    try {
      const data = await apiUpload('/profile/photos', { file })
      onProfileReplace(data.data.profile)
      toast.success(t('Photo uploaded.'))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
      setPreview(null)
      e.target.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('Delete this photo?'))) return
    try {
      const data = await api(`/profile/photos/${id}`, { method: 'DELETE' })
      onProfileReplace(data.data.profile)
      toast.success(t('Photo deleted.'))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handlePrimary = async (id) => {
    try {
      const data = await api(`/profile/photos/${id}/primary`, { method: 'PUT' })
      onProfileReplace(data.data.profile)
      toast.success(t('Profile photo updated.'))
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="field">
          <label htmlFor="ph-upload">{t('Add photos')}</label>
          <input
            id="ph-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="form-input"
            onChange={handleUpload}
            disabled={disabled || uploading || photos.length >= 6}
          />
          <span className="hint">
            {t('First photo automatically becomes your profile photo. JPG/PNG/WEBP — max 5 MB each, up to 6 photos total.')}
          </span>
        </div>
      </div>

      {preview && (
        <div className="photo-upload-preview" role="status" aria-live="polite">
          <p>{preview.ready ? t('Uploading photo…') : t('Preparing photo preview…')} {preview.name}</p>
          <div className="photo-upload-progress" role="progressbar" aria-label={t('Photo preview and upload progress')}>
            <span />
          </div>
          <img
            src={preview.url}
            alt={t('Selected photo preview')}
            onLoad={() => setPreview((current) => current?.url === preview.url
              ? { ...current, ready: true }
              : current)}
            onError={() => toast.error(t('Could not preview the selected photo.'))}
          />
        </div>
      )}

      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div className="photo-tile" key={photo.id}>
              <img src={photo.url} alt="Profile photo" />
              {photo.isMain && <span className="photo-badge">{t('Profile photo')}</span>}
              {!disabled && (
                <div className="photo-actions">
                  {!photo.isMain && (
                    <button type="button" className="primary-btn" onClick={() => handlePrimary(photo.id)}>
                      {t('Set as profile')}
                    </button>
                  )}
                  <button type="button" className="delete-btn" onClick={() => handleDelete(photo.id)}>
                    {t('Delete')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="photo-empty">
          {t('No photos yet — the first photo you upload becomes your profile photo.')}
        </div>
      )}
    </div>
  )
}
