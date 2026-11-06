import { RASHI_OPTIONS, NAKSHATRA_OPTIONS, PADA_OPTIONS, MANGLIK_OPTIONS } from '../../utils/profileOptions.js'
import { apiUpload } from '../../api/api.js'

export default function StepHoroscope({ value = {}, onChange, disabled, onProfileReplace }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  const handleKundliUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await apiUpload('/profile/kundli', { file })
      onProfileReplace(data.data.profile) // server returns full fresh profile
    } finally {
      e.target.value = '' // allow re-selecting the same file later
    }
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="tob">Time of birth</label>
        <input id="tob" type="time" className="form-input"
          value={value.timeOfBirth ?? ''} onChange={set('timeOfBirth')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="pob">Place of birth</label>
        <input id="pob" className="form-input" maxLength={120}
          placeholder="e.g. Hyderabad, Telangana"
          value={value.placeOfBirth ?? ''} onChange={set('placeOfBirth')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="rashi">Rashi (moon sign)</label>
        <select id="rashi" className="form-input" value={value.rashi ?? ''}
          onChange={set('rashi')} disabled={disabled}>
          <option value="">Select rashi…</option>
          {RASHI_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="nakshatra">Nakshatra</label>
        <select id="nakshatra" className="form-input" value={value.nakshatra ?? ''}
          onChange={set('nakshatra')} disabled={disabled}>
          <option value="">Select nakshatra…</option>
          {NAKSHATRA_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="pada">Pada</label>
        <select id="pada" className="form-input" value={value.pada ?? ''}
          onChange={set('pada')} disabled={disabled}>
          <option value="">Select…</option>
          {PADA_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="manglik">Manglik / Kuja dosham</label>
        <select id="manglik" className="form-input" value={value.manglik ?? ''}
          onChange={set('manglik')} disabled={disabled}>
          <option value="">Select…</option>
          {MANGLIK_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="field field-full">
        <label htmlFor="graha">Graha / planet details</label>
        <textarea id="graha" className="form-input" rows={3} maxLength={500}
          placeholder="Optional — positions of grahas, dasha periods, etc."
          value={value.grahaDetails ?? ''} onChange={set('grahaDetails')} disabled={disabled} />
      </div>

      {/* kundli image */}
      <div className="field field-full">
        <label htmlFor="kundli">Kundli image</label>
        <input
          id="kundli"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="form-input"
          onChange={handleKundliUpload}
          disabled={disabled}
        />
        <span className="hint">JPG, PNG or WEBP — max 5 MB. Uploading a new one replaces the old image.</span>
        {value.kundliImageUrl && (
          <img src={value.kundliImageUrl} alt="Kundli chart" className="kundli-preview" />
        )}
      </div>
    </div>
  )
}
