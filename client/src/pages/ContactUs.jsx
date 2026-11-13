import { useState } from 'react'
import { api, toast } from '../api/api.js'
import { usePageMeta } from '../utils/usePageMeta.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function ContactUs({ embedded = false }) {
  const { t } = useLanguage()
  usePageMeta(
    t('Contact us'),
    t('Questions or profile assistance? Send a message to the Padmashali Matrimony admin team.'),
    !embedded
  )

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api('/contact', { method: 'POST', body: form })
      toast.success(t('Message sent!'))
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="public-page">
      <h1 className="public-title">{t('Contact us')}</h1>

      <form className="contact-form" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="cf-name">{t('Your name *')}</label>
            <input id="cf-name" className="form-input" required maxLength={80}
              value={form.name} onChange={set('name')} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="cf-email">{t('Email')} *</label>
            <input id="cf-email" type="email" className="form-input" required maxLength={120}
              value={form.email} onChange={set('email')} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="cf-phone">{t('Phone (optional)')}</label>
            <input id="cf-phone" className="form-input" maxLength={20}
              value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="cf-subject">{t('Subject (optional)')}</label>
            <input id="cf-subject" className="form-input" maxLength={120}
              placeholder={t('e.g. Question about my profile')}
              value={form.subject} onChange={set('subject')} />
          </div>
          <div className="field field-full">
            <label htmlFor="cf-message">{t('Message *')} <span className="hint">{t('(at least 10 characters)')}</span></label>
            <textarea id="cf-message" className="form-input" rows={5} required minLength={10} maxLength={1000}
              value={form.message} onChange={set('message')} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={sending} style={{ marginTop: 16 }}>
          {sending ? t('Sending…') : t('Send message')}
        </button>
      </form>
    </div>
  )
}
