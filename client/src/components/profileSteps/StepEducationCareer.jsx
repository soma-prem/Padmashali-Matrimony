import { useLanguage } from '../../context/LanguageContext.jsx'

export default function StepEducationCareer({ value = {}, onChange, disabled }) {
  const { t } = useLanguage()
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="ed-q">{t('Highest qualification')}</label>
        <input id="ed-q" className="form-input" maxLength={120}
          placeholder={t('e.g. B.Tech, M.Sc')} value={value.highestQualification ?? ''}
          onChange={set('highestQualification')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="ed-c">{t('College / University')}</label>
        <input id="ed-c" className="form-input" maxLength={120}
          value={value.college ?? ''} onChange={set('college')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="ed-f">{t('Field of study')}</label>
        <input id="ed-f" className="form-input" maxLength={120}
          placeholder={t('e.g. Computer Science')}
          value={value.fieldOfStudy ?? ''} onChange={set('fieldOfStudy')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="cr-o">{t('Occupation')}</label>
        <input id="cr-o" className="form-input" maxLength={120}
          placeholder={t('e.g. Software Engineer')}
          value={value.occupation ?? ''} onChange={set('occupation')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="cr-co">{t('Company')}</label>
        <input id="cr-co" className="form-input" maxLength={120}
          value={value.company ?? ''} onChange={set('company')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="cr-i">{t('Annual income')}</label>
        <input id="cr-i" className="form-input" maxLength={60}
          placeholder={t('e.g. 6 - 10 LPA')} value={value.annualIncome ?? ''}
          onChange={set('annualIncome')} disabled={disabled} />
      </div>
    </div>
  )
}
