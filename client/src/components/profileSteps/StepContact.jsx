export default function StepContact({ value = {}, onChange, disabled }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  return (
    <div>
      <div className="section-note">
        🔒 <strong>Only visible to admin and your approved matches.</strong> Nobody browsing the
        website can see these details — they are shared only after an interest request is
        approved by the admin.
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="ct-mob">Mobile number</label>
          <input id="ct-mob" className="form-input" maxLength={17}
            placeholder="e.g. 9876543210"
            value={value.mobile ?? ''} onChange={set('mobile')} disabled={disabled} />
          <span className="hint">10–15 digits, with country code if needed.</span>
        </div>

        <div className="field">
          <label htmlFor="ct-wa">WhatsApp number</label>
          <input id="ct-wa" className="form-input" maxLength={17}
            placeholder="If different from mobile"
            value={value.whatsapp ?? ''} onChange={set('whatsapp')} disabled={disabled} />
        </div>

        <div className="field">
          <label htmlFor="ct-mail">Email</label>
          <input id="ct-mail" type="email" className="form-input" maxLength={120}
            placeholder="shared-email@example.com"
            value={value.email ?? ''} onChange={set('email')} disabled={disabled} />
          <span className="hint">Can be different from your login email (optional).</span>
        </div>

        <div className="field field-full">
          <label htmlFor="ct-addr">Address</label>
          <textarea id="ct-addr" className="form-input" rows={3} maxLength={400}
            placeholder="House / street, city, pincode…"
            value={value.address ?? ''} onChange={set('address')} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}
