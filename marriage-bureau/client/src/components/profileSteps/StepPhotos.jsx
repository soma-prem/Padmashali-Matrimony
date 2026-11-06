import { api, apiUpload } from '../../api/api.js'

export default function StepPhotos({ profile = {}, onProfileReplace, disabled }) {
  const photos = profile.photos || []

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 6) {
      e.target.value = ''
      return
    }
    try {
      const data = await apiUpload('/profile/photos', { file })
      onProfileReplace(data.data.profile)
    } finally {
      e.target.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this photo?')) return
    const data = await api(`/profile/photos/${id}`, { method: 'DELETE' })
    onProfileReplace(data.data.profile)
  }

  const handlePrimary = async (id) => {
    const data = await api(`/profile/photos/${id}/primary`, { method: 'PUT' })
    onProfileReplace(data.data.profile)
  }

  return (
    <div>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="field">
          <label htmlFor="ph-upload">Add photos</label>
          <input
            id="ph-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="form-input"
            onChange={handleUpload}
            disabled={disabled || photos.length >= 6}
          />
          <span className="hint">
            First photo automatically becomes your profile photo. JPG/PNG/WEBP — max 5 MB each,
            up to 6 photos total.
          </span>
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div className="photo-tile" key={photo.id}>
              <img src={photo.url} alt="Profile photo" />
              {photo.isMain && <span className="photo-badge">Profile photo</span>}
              {!disabled && (
                <div className="photo-actions">
                  {!photo.isMain && (
                    <button type="button" className="primary-btn" onClick={() => handlePrimary(photo.id)}>
                      Set as profile
                    </button>
                  )}
                  <button type="button" className="delete-btn" onClick={() => handleDelete(photo.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="photo-empty">
          No photos yet — the first photo you upload becomes your profile photo.
        </div>
      )}
    </div>
  )
}
