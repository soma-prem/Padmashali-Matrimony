import { useEffect, useState } from 'react'
import { api } from '../../api/api.js'
import { CASTE_OPTIONS_BY_RELIGION, RELIGION_OPTIONS } from '../../utils/profileOptions.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

const OTHER = 'Other'

export default function StepCommunity({ value = {}, onChange, disabled }) {
  const { t } = useLanguage()
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  const casteOptions = CASTE_OPTIONS_BY_RELIGION[value.religion] ?? []
  const [customCasteSelected, setCustomCasteSelected] = useState(false)
  const customCaste = customCasteSelected || (value.caste && !casteOptions.includes(value.caste))
  const [gotraOptions, setGotraOptions] = useState(value.gotra ? [value.gotra] : [])
  const [customGotra, setCustomGotra] = useState(false)
  const [optionsError, setOptionsError] = useState('')

  useEffect(() => {
    let cancelled = false
    api('/profile/community-options')
      .then((response) => {
        if (!cancelled) {
          setGotraOptions([...new Set([value.gotra, ...response.data.gotras].filter(Boolean))])
        }
      })
      .catch((error) => {
        if (!cancelled) setOptionsError(`Could not load Gotra suggestions: ${error.message}`)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="pc-religion">{t('Religion')}</label>
        <select id="pc-religion" className="form-input" value={value.religion ?? ''}
          onChange={(e) => {
            setCustomCasteSelected(false)
            onChange({ ...value, religion: e.target.value, caste: '' })
          }}
          disabled={disabled}>
          <option value="">{t('Select religion…')}</option>
          {RELIGION_OPTIONS.map((religion) => (
            <option key={religion.value} value={religion.value}>{religion.label}</option>
          ))}
        </select>
      </div>

      {value.religion && (
        <div className="field">
          <label htmlFor="pc-caste">{t('Caste')}</label>
          <select id="pc-caste" className="form-input"
            value={customCaste ? OTHER : value.caste ?? ''}
            onChange={(e) => {
              const isOther = e.target.value === OTHER
              setCustomCasteSelected(isOther)
              onChange({ ...value, caste: isOther ? '' : e.target.value })
            }}
            disabled={disabled}>
            <option value="">{t('Select caste…')}</option>
            {casteOptions.map((caste) => <option key={caste} value={caste}>{caste}</option>)}
            <option value={OTHER}>{t('Other — enter caste')}</option>
          </select>
          {customCaste && (
            <input className="form-input" maxLength={60} placeholder={t('Enter your caste')}
              value={value.caste ?? ''} onChange={set('caste')} disabled={disabled} />
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="pc-gotra">{t('Gotra')}</label>
        <select id="pc-gotra" className="form-input"
          value={customGotra ? OTHER : value.gotra ?? ''}
          onChange={(e) => {
            const isOther = e.target.value === OTHER
            setCustomGotra(isOther)
            onChange({ ...value, gotra: isOther ? '' : e.target.value })
          }}
          disabled={disabled}>
          <option value="">{t('Select Gotra (optional)…')}</option>
          {gotraOptions.map((gotra) => <option key={gotra} value={gotra}>{gotra}</option>)}
          <option value={OTHER}>{t('Other — enter Gotra')}</option>
        </select>
        {customGotra && (
          <input className="form-input" maxLength={60} placeholder={t('Enter your Gotra')}
            value={value.gotra ?? ''} onChange={set('gotra')} disabled={disabled} />
        )}
        <span className="hint">{t('Optional — leave blank if unknown.')}</span>
        {optionsError && <span className="hint form-error">{optionsError}</span>}
      </div>
    </div>
  )
}
