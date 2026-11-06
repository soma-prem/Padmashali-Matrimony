import { CASTE_OPTIONS, SUBCASTE_PADMASHALI, SUBCASTE_DEVANGA } from '../../utils/profileOptions.js'

const OTHER = 'Other'

export default function StepCommunity({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  const showPadmashaliList = ['Padmashali', 'Devanga'].includes(value.caste)
  const subCasteOptions =
    value.caste === 'Padmashali' ? SUBCASTE_PADMASHALI
    : value.caste === 'Devanga' ? SUBCASTE_DEVANGA
    : null

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="pc-caste">Caste</label>
        <select id="pc-caste" className="form-input" value={value.caste ?? ''}
          onChange={set('caste')} disabled={disabled}>
          <option value="">Select caste…</option>
          {CASTE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="hint">Padmashali is preselected by default for our community.</span>
      </div>

      <div className="field">
        <label htmlFor="pc-subcaste">Sub-caste / Kulam</label>
        {subCasteOptions ? (
          <select id="pc-subcaste" className="form-input" value={value.subCasteKulam ?? ''}
            onChange={set('subCasteKulam')} disabled={disabled}>
            <option value="">Select…</option>
            {subCasteOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <input id="pc-subcaste" className="form-input" maxLength={60}
            value={value.subCasteKulam ?? ''} onChange={set('subCasteKulam')} disabled={disabled} />
        )}
      </div>

      {value.caste === OTHER && (
        <div className="field">
          <label htmlFor="pc-caste-other">Your community name</label>
          <input id="pc-caste-other" className="form-input" maxLength={60}
            value={value.casteOther ?? ''} onChange={set('casteOther')} disabled={disabled} />
          <span className="hint">Type your exact community name here.</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="pc-gotra">Gotra</label>
        <input id="pc-gotra" className="form-input" maxLength={60}
          value={value.gotra ?? ''} onChange={set('gotra')} disabled={disabled} />
        <span className="hint">Optional — leave blank if unknown.</span>
      </div>
    </div>
  )
}
