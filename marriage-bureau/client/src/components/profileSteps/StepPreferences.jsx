import { PREF_MARITAL_OPTIONS } from '../../utils/profileOptions.js'

export default function StepPreferences({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => {
    const v = e.target.value
    // keep number inputs clean — empty string would be rejected by the API
    onChange({ ...value, [key]: v === '' ? '' : v })
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="pr-minage">Minimum age</label>
        <input id="pr-minage" type="number" className="form-input" min={18} max={100}
          value={value.minAge ?? ''} onChange={set('minAge')} disabled={disabled} />
        <span className="hint">18 – 100</span>
      </div>

      <div className="field">
        <label htmlFor="pr-maxage">Maximum age</label>
        <input id="pr-maxage" type="number" className="form-input" min={18} max={100}
          value={value.maxAge ?? ''} onChange={set('maxAge')} disabled={disabled} />
        <span className="hint">18 – 100</span>
      </div>

      <div className="field">
        <label htmlFor="pr-minh">Minimum height (cm)</label>
        <input id="pr-minh" type="number" className="form-input" min={100} max={250}
          value={value.minHeightCm ?? ''} onChange={set('minHeightCm')} disabled={disabled} />
        <span className="hint">100 – 250</span>
      </div>

      <div className="field">
        <label htmlFor="pr-maxh">Maximum height (cm)</label>
        <input id="pr-maxh" type="number" className="form-input" min={100} max={250}
          value={value.maxHeightCm ?? ''} onChange={set('maxHeightCm')} disabled={disabled} />
        <span className="hint">100 – 250</span>
      </div>

      <div className="field">
        <label htmlFor="pr-edu">Preferred education</label>
        <input id="pr-edu" className="form-input" maxLength={120}
          placeholder="e.g. Graduate, PG"
          value={value.education ?? ''} onChange={set('education')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="pr-loc">Preferred location</label>
        <input id="pr-loc" className="form-input" maxLength={120}
          placeholder="e.g. Hyderabad / near Telangana"
          value={value.location ?? ''} onChange={set('location')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="pr-marital">Preferred marital status</label>
        <select id="pr-marital" className="form-input" value={value.maritalStatus ?? ''}
          onChange={set('maritalStatus')} disabled={disabled}>
          <option value="">Select…</option>
          {PREF_MARITAL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
    </div>
  )
}
