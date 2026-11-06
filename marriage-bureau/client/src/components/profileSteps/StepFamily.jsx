export default function StepFamily({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="f-fo">Father's name</label>
        <input id="f-fo" className="form-input" maxLength={100}
          value={value.fatherName ?? ''} onChange={set('fatherName')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-foc">Father's occupation</label>
        <input id="f-foc" className="form-input" maxLength={100}
          value={value.fatherOccupation ?? ''} onChange={set('fatherOccupation')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-mo">Mother's name</label>
        <input id="f-mo" className="form-input" maxLength={100}
          value={value.motherName ?? ''} onChange={set('motherName')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-moc">Mother's occupation</label>
        <input id="f-moc" className="form-input" maxLength={100}
          value={value.motherOccupation ?? ''} onChange={set('motherOccupation')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-b">Brothers</label>
        <input id="f-b" type="number" className="form-input" min={0} max={20}
          value={value.brothers ?? ''} onChange={set('brothers')} disabled={disabled} />
        <span className="hint">Married or unmarried — total count.</span>
      </div>

      <div className="field">
        <label htmlFor="f-s">Sisters</label>
        <input id="f-s" type="number" className="form-input" min={0} max={20}
          value={value.sisters ?? ''} onChange={set('sisters')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-type">Family type</label>
        <select id="f-type" className="form-input" value={value.familyType ?? ''}
          onChange={set('familyType')} disabled={disabled}>
          <option value="">Select…</option>
          <option value="nuclear">Nuclear</option>
          <option value="joint">Joint</option>
          <option value="extended">Extended</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-values">Family values</label>
        <select id="f-values" className="form-input" value={value.familyValues ?? ''}
          onChange={set('familyValues')} disabled={disabled}>
          <option value="">Select…</option>
          <option value="traditional">Traditional</option>
          <option value="moderate">Moderate</option>
          <option value="liberal">Liberal</option>
          <option value="spiritual">Spiritual</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-native">Native place</label>
        <input id="f-native" className="form-input" maxLength={120}
          placeholder="e.g. Warangal, Telangana"
          value={value.nativePlace ?? ''} onChange={set('nativePlace')} disabled={disabled} />
      </div>
    </div>
  )
}
