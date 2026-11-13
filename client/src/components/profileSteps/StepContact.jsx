import { useLanguage } from '../../context/LanguageContext.jsx'

export default function StepContact({ value = {}, onChange, disabled }) {
  const { t } = useLanguage()
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  return (
    <div>
      <div className="section-note">
        🔒 <strong>{t('Only visible to admins and profiles assigned to you.')}</strong> {t('These details are shared only with profiles the admin assigns to you.')}
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="ct-mob">{t('Mobile number')}</label>
          <input id="ct-mob" className="form-input" maxLength={17}
            placeholder={t('e.g. 9876543210')}
            value={value.mobile ?? ''} onChange={set('mobile')} disabled={disabled} />
          <span className="hint">{t('10–15 digits, with country code if needed.')}</span>
        </div>

        <div className="field">
          <label htmlFor="ct-wa">{t('WhatsApp number')}</label>
          <input id="ct-wa" className="form-input" maxLength={17}
            placeholder={t('If different from mobile')}
            value={value.whatsapp ?? ''} onChange={set('whatsapp')} disabled={disabled} />
        </div>

        <div className="field">
          <label htmlFor="ct-mail">{t('Email')}</label>
          <input id="ct-mail" type="email" className="form-input" maxLength={120}
            placeholder="shared-email@example.com"
            value={value.email ?? ''} onChange={set('email')} disabled={disabled} />
          <span className="hint">{t('Can be different from your login email (optional).')}</span>
        </div>

        <div className="field field-full">
          <label htmlFor="ct-addr">{t('Address')}</label>
          <textarea id="ct-addr" className="form-input" rows={3} maxLength={400}
            placeholder="House / street, city, pincode…"
            value={value.address ?? ''} onChange={set('address')} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}
