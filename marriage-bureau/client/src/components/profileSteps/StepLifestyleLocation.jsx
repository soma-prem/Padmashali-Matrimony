import { DIET_OPTIONS, HABIT_OPTIONS } from '../../utils/profileOptions.js'

export default function StepLifestyleLocation({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  const setBool = (key) => (e) => onChange({ ...value, [key]: e.target.checked })

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="l-diet">Diet</label>
        <select id="l-diet" className="form-input" value={value.diet ?? ''}
          onChange={set('diet')} disabled={disabled}>
          <option value="">Select…</option>
          {DIET_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="l-smoke">Smoking</label>
        <select id="l-smoke" className="form-input" value={value.smoking ?? ''}
          onChange={set('smoking')} disabled={disabled}>
          <option value="">Select…</option>
          {HABIT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="l-drink">Drinking</label>
        <select id="l-drink" className="form-input" value={value.drinking ?? ''}
          onChange={set('drinking')} disabled={disabled}>
          <option value="">Select…</option>
          {HABIT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>
      </div>

      <div className="field field-full">
        <label htmlFor="l-hobbies">Hobbies &amp; interests</label>
        <textarea id="l-hobbies" className="form-input" rows={3} maxLength={300}
          placeholder="Cricket, classical music, travelling…"
          value={value.hobbies ?? ''} onChange={set('hobbies')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="l-city">City</label>
        <input id="l-city" className="form-input" maxLength={80}
          value={value.city ?? ''} onChange={set('city')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="l-state">State</label>
        <input id="l-state" className="form-input" maxLength={80}
          value={value.state ?? ''} onChange={set('state')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="l-country">Country</label>
        <input id="l-country" className="form-input" maxLength={80}
          value={value.country ?? ''} onChange={set('country')} disabled={disabled} />
      </div>

      <div className="field">
        <div className="check-row">
          <input id="l-reloc" type="checkbox" checked={value.willingToRelocate ?? false}
            onChange={(e) => onChange({
              ...value,
              willingToRelocate: e.target.checked,
              ...(!e.target.checked ? { relocationLocation: '' } : {}),
            })} disabled={disabled} />
          <label htmlFor="l-reloc">Willing to relocate</label>
        </div>
      </div>
      {value.willingToRelocate && (
        <div className="field field-full">
          <label htmlFor="l-relocation-location">Preferred relocation location</label>
          <input id="l-relocation-location" className="form-input" maxLength={120}
            placeholder="City, state, or country"
            value={value.relocationLocation ?? ''}
            onChange={set('relocationLocation')} disabled={disabled} required />
        </div>
      )}
    </div>
  )
}
