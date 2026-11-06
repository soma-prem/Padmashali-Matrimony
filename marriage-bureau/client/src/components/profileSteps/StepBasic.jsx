import { useState } from 'react'

function heightPartsFromCm(heightCm) {
  if (!heightCm) return { feet: '', inches: '' }

  const totalInches = Math.round(Number(heightCm) / 2.54)
  return {
    feet: String(Math.floor(totalInches / 12)),
    inches: String(totalInches % 12),
  }
}

function isValidHeight(feet, inches) {
  const heightCm = Math.round((Number(feet) * 12 + Number(inches)) * 2.54)
  return heightCm >= 100 && heightCm <= 250
}

export default function StepBasic({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  const [heightUnit, setHeightUnit] = useState('cm')
  const [height, setHeight] = useState(() => heightPartsFromCm(value.heightCm))

  const changeHeightUnit = (unit) => {
    setHeightUnit(unit)
    if (unit === 'ft') setHeight(heightPartsFromCm(value.heightCm))
  }

  const setHeightPart = (part, selectedValue) => {
    const next = { ...height, [part]: selectedValue }
    if (part === 'feet' && next.inches !== '' && !isValidHeight(selectedValue, next.inches)) {
      next.inches = ''
    }
    setHeight(next)
    const heightCm = next.feet !== '' && next.inches !== '' && isValidHeight(next.feet, next.inches)
      ? String(Math.round((Number(next.feet) * 12 + Number(next.inches)) * 2.54))
      : ''
    onChange({ ...value, heightCm })
  }

  // DOB bounds: valid if between 18 and 100 years old
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0]
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0]

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="pb-name">Full name</label>
        <input id="pb-name" className="form-input" maxLength={80}
          value={value.name ?? ''} onChange={set('name')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="pb-gender">Gender</label>
        <select id="pb-gender" className="form-input" value={value.gender ?? ''}
          onChange={set('gender')} disabled={disabled}>
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="pb-dob">Date of birth</label>
        <input id="pb-dob" type="date" className="form-input" min={minDate} max={maxDate}
          value={value.dateOfBirth ?? ''} onChange={set('dateOfBirth')} disabled={disabled} />
        <span className="hint">Minimum age to register is 18 years.</span>
      </div>

      <div className="field">
        <label htmlFor="pb-height-unit">Height</label>
        <select id="pb-height-unit" className="form-input" value={heightUnit}
          onChange={(e) => changeHeightUnit(e.target.value)} disabled={disabled}>
          <option value="cm">Centimeters (cm)</option>
          <option value="ft">Feet and inches</option>
        </select>
        {heightUnit === 'cm' ? (
          <>
            <input id="pb-height-cm" type="number" className="form-input" min={100} max={250}
              placeholder="e.g. 168" value={value.heightCm ?? ''} onChange={set('heightCm')} disabled={disabled} />
            <span className="hint">100 – 250 cm</span>
          </>
        ) : (
          <>
            <div className="height-inputs">
              <select id="pb-height-feet" className="form-input" aria-label="Height in feet"
                value={height.feet} onChange={(e) => setHeightPart('feet', e.target.value)} disabled={disabled}>
                <option value="">Feet</option>
                {[3, 4, 5, 6, 7, 8].map((feet) => (
                  <option key={feet} value={feet}
                    disabled={!Array.from({ length: 12 }, (_, inches) => isValidHeight(feet, inches)).some(Boolean)}>
                    {feet} ft
                  </option>
                ))}
              </select>
              <select id="pb-height-inches" className="form-input" aria-label="Height in inches"
                value={height.inches} onChange={(e) => setHeightPart('inches', e.target.value)} disabled={disabled}>
                <option value="">Inches</option>
                {Array.from({ length: 12 }, (_, inches) => (
                  <option key={inches} value={inches}
                    disabled={height.feet !== '' && !isValidHeight(height.feet, inches)}>
                    {inches} in
                  </option>
                ))}
              </select>
            </div>
            <span className="hint">Choose a height between 3 ft 4 in and 8 ft 2 in.</span>
          </>
        )}
      </div>

      <div className="field">
        <label htmlFor="pb-weight">Weight (kg)</label>
        <input id="pb-weight" type="number" className="form-input" min={30} max={200}
          placeholder="e.g. 62" value={value.weightKg ?? ''} onChange={set('weightKg')} disabled={disabled} />
        <span className="hint">30 – 200</span>
      </div>

      <div className="field">
        <label htmlFor="pb-marital">Marital status</label>
        <select id="pb-marital" className="form-input" value={value.maritalStatus ?? ''}
          onChange={set('maritalStatus')} disabled={disabled}>
          <option value="">Select…</option>
          <option value="never_married">Never married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
          <option value="separated">Separated</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="pb-tongue">Mother tongue</label>
        <input id="pb-tongue" className="form-input" list="tongues" maxLength={40}
          value={value.motherTongue ?? ''} onChange={set('motherTongue')} disabled={disabled} />
        <datalist id="tongues">
          <option value="Telugu" /><option value="Tamil" /><option value="Kannada" />
          <option value="Hindi" /><option value="Marathi" /><option value="English" />
        </datalist>
      </div>

      <div className="field field-full">
        <label htmlFor="pb-about">About me</label>
        <textarea id="pb-about" className="form-input" rows={4} maxLength={1200}
          placeholder="Describe yourself, your family background, expectations…"
          value={value.aboutMe ?? ''} onChange={set('aboutMe')} disabled={disabled} />
      </div>
    </div>
  )
}
