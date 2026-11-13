import { useEffect, useState } from 'react'
import { RASHI_OPTIONS, NAKSHATRA_OPTIONS, PADA_OPTIONS, MANGLIK_OPTIONS } from '../../utils/profileOptions.js'
import { apiUpload } from '../../api/api.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

function getTimeParts(time) {
  if (!time) return { hour: '', minute: '', period: '' }
  const [hours, minutes] = time.split(':').map(Number)
  return {
    hour: String(hours % 12 || 12),
    minute: String(minutes).padStart(2, '0'),
    period: hours >= 12 ? 'PM' : 'AM',
  }
}

function to24HourTime({ hour, minute, period }) {
  if (!hour || !minute || !period) return ''
  const hours = (Number(hour) % 12) + (period === 'PM' ? 12 : 0)
  return `${String(hours).padStart(2, '0')}:${minute}`
}

export default function StepHoroscope({ value = {}, onChange, disabled, onProfileReplace }) {
  const { t } = useLanguage()
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  const [timeParts, setTimeParts] = useState(() => getTimeParts(value.timeOfBirth))

  useEffect(() => {
    if (value.timeOfBirth) setTimeParts(getTimeParts(value.timeOfBirth))
  }, [value.timeOfBirth])

  const setTimePart = (part, selectedValue) => {
    const next = { ...timeParts, [part]: selectedValue }
    setTimeParts(next)
    onChange({ ...value, timeOfBirth: to24HourTime(next) })
  }

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
        <label htmlFor="tob-hour">{t('Time of birth (12-hour)')}</label>
        <div className="height-inputs">
          <select id="tob-hour" className="form-input" aria-label="Birth hour"
            value={timeParts.hour} onChange={(e) => setTimePart('hour', e.target.value)} disabled={disabled}>
            <option value="">{t('Hour')}</option>
            {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
          </select>
          <select id="tob-minute" className="form-input" aria-label="Birth minute"
            value={timeParts.minute} onChange={(e) => setTimePart('minute', e.target.value)} disabled={disabled}>
            <option value="">{t('Minute')}</option>
            {Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0')).map((minute) => (
              <option key={minute} value={minute}>{minute}</option>
            ))}
          </select>
          <select id="tob-period" className="form-input" aria-label="AM or PM"
            value={timeParts.period} onChange={(e) => setTimePart('period', e.target.value)} disabled={disabled}>
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pob">{t('Place of birth')}</label>
        <input id="pob" className="form-input" maxLength={120}
          placeholder={t('e.g. Hyderabad, Telangana')}
          value={value.placeOfBirth ?? ''} onChange={set('placeOfBirth')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="rashi">{t('Rashi (moon sign)')}</label>
        <select id="rashi" className="form-input" value={value.rashi ?? ''}
          onChange={set('rashi')} disabled={disabled}>
          <option value="">{t('Select rashi…')}</option>
          {RASHI_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="nakshatra">{t('Nakshatra')}</label>
        <select id="nakshatra" className="form-input" value={value.nakshatra ?? ''}
          onChange={set('nakshatra')} disabled={disabled}>
          <option value="">{t('Select nakshatra…')}</option>
          {NAKSHATRA_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="pada">{t('Pada')}</label>
        <select id="pada" className="form-input" value={value.pada ?? ''}
          onChange={set('pada')} disabled={disabled}>
          <option value="">{t('Select…')}</option>
          {PADA_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="manglik">{t('Manglik / Kuja dosham')}</label>
        <select id="manglik" className="form-input" value={value.manglik ?? ''}
          onChange={set('manglik')} disabled={disabled}>
          <option value="">{t('Select…')}</option>
          {MANGLIK_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="field field-full">
        <label htmlFor="graha">{t('Graha / planet details')}</label>
        <textarea id="graha" className="form-input" rows={3} maxLength={500}
          placeholder={t('Optional — positions of grahas, dasha periods, etc.')}
          value={value.grahaDetails ?? ''} onChange={set('grahaDetails')} disabled={disabled} />
      </div>

      {/* kundli image */}
      <div className="field field-full">
        <label htmlFor="kundli">{t('Kundli image')}</label>
        <input
          id="kundli"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="form-input"
          onChange={handleKundliUpload}
          disabled={disabled}
        />
        <span className="hint">{t('JPG, PNG or WEBP — max 5 MB. Uploading a new one replaces the old image.')}</span>
        {value.kundliImageUrl && (
          <img src={value.kundliImageUrl} alt={t('Kundli chart')} className="kundli-preview" />
        )}
      </div>
    </div>
  )
}
