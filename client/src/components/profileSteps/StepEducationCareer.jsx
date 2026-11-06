export default function StepEducationCareer({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="ed-q">Highest qualification</label>
        <input id="ed-q" className="form-input" maxLength={120}
          placeholder="e.g. B.Tech, M.Sc" value={value.highestQualification ?? ''}
          onChange={set('highestQualification')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="ed-c">College / University</label>
        <input id="ed-c" className="form-input" maxLength={120}
          value={value.college ?? ''} onChange={set('college')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="ed-f">Field of study</label>
        <input id="ed-f" className="form-input" maxLength={120}
          placeholder="e.g. Computer Science"
          value={value.fieldOfStudy ?? ''} onChange={set('fieldOfStudy')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="cr-o">Occupation</label>
        <input id="cr-o" className="form-input" maxLength={120}
          placeholder="e.g. Software Engineer"
          value={value.occupation ?? ''} onChange={set('occupation')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="cr-co">Company</label>
        <input id="cr-co" className="form-input" maxLength={120}
          value={value.company ?? ''} onChange={set('company')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="cr-i">Annual income</label>
        <input id="cr-i" className="form-input" maxLength={60}
          placeholder="e.g. 6 - 10 LPA" value={value.annualIncome ?? ''}
          onChange={set('annualIncome')} disabled={disabled} />
      </div>
    </div>
  )
}
