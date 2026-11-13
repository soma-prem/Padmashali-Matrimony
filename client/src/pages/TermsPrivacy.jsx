import { usePageMeta } from '../utils/usePageMeta.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function TermsPrivacy() {
  const { t } = useLanguage()
  usePageMeta(
    t('Terms & Privacy Policy'),
    t('Terms of use and privacy policy of Padmashali Samaj Matrimony. Contact data is shared only with an admin-assigned match.')
  )

  return (
    <div className="public-page">
      <h1 className="public-title">{t('Terms of use & Privacy policy')}</h1>

      <div className="community-card">
        <h2>{t('1. Using this website')}</h2>
        <p>
          {t('This website is a community matrimony service. You must be at least 18 years old to register and use it. Information in your profile must be true and yours to share.')}
        </p>

        <h2>{t('2. Accounts and profiles')}</h2>
        <p>
          {t('Every profile is reviewed by our admin team. We may reject a profile (with a reason) or deactivate an account at our discretion, for example when a profile is incomplete, inaccurate, or not suitable for a community matrimony service.')}
        </p>

        <h2>{t('3. Privacy of contact details')}</h2>
        <p>
          <strong>{t('Mobile, WhatsApp, email and address are never public.')}</strong> {t('They are visible only to (a) our admin team for verification and matchmaking, and (b) profiles the admin assigns to you. Contact details are never included in profile-list responses.')}
        </p>

        <h2>{t('4. Profiles of the opposite gender only')}</h2>
        <p>
          {t('Members cannot browse the profile directory. The admin may assign one or more approved, paid profiles of the opposite gender, and only those assigned profiles are available to each member.')}
        </p>

        <h2>{t('5. Photography & uploads')}</h2>
        <p>
          {t("You may upload up to 6 profile photos and one kundli image (max 5 MB, JPG/PNG/WEBP). Deleting a photo removes it from the site. Do not upload anything you don't have the right to publish, and don't upload anyone else's photos without their permission.")}
        </p>

        <h2>{t('6. Payments and assigned matches')}</h2>
        <p>
          {t('After profile approval, the admin sends payment instructions. The member submits payment details for verification. The admin can assign profiles only after both profiles are approved, active and have verified payments. Each member sees only profiles assigned to them.')}
        </p>

        <h2>{t('7. Notifications')}</h2>
        <p>
          {t('All communications are delivered inside the website (no emails/SMS). Watch the bell icon on your dashboard.')}
        </p>

        <h2>{t('8. Data storage')}</h2>
        <p>
          {t('Account data and profiles are stored in a secure database (Supabase). Images are stored on Cloudinary. Passwords are stored only as salted hashes — never as plain text, and never returned by any API.')}
        </p>

        <h2>{t('9. No guarantee')}</h2>
        <p>
          {t('We work hard to keep profiles genuine, but this is a meeting platform — we cannot guarantee the accuracy of any profile, nor guarantee that any match will be found. Please use your own judgement, verify details directly with your approved matches and involve family in the final decision.')}
        </p>

        <h2>{t('10. Changes')}</h2>
        <p>
          {t('These terms may be updated for a better process. Registered members will receive an in-website notification of significant changes.')}
        </p>
      </div>
    </div>
  )
}
