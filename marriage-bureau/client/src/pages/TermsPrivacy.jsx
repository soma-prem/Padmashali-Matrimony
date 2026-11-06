import { usePageMeta } from '../utils/usePageMeta.js'

export default function TermsPrivacy() {
  usePageMeta(
    'Terms & Privacy Policy',
    'Terms of use and privacy policy of Padmashali Samaj Matrimony. Contact data is shared only with an approved connection.'
  )

  return (
    <div className="public-page">
      <h1 className="public-title">Terms of use &amp; Privacy policy</h1>

      <div className="community-card">
        <h2>1. Using this website</h2>
        <p>
          This website is a community matrimony service. You must be at least 18 years old to
          register and use it. Information in your profile must be true and yours to share.
        </p>

        <h2>2. Accounts and profiles</h2>
        <p>
          Every profile is reviewed by our admin team. We may reject a profile (with a reason)
          or deactivate an account at our discretion, for example when a profile is
          incomplete, inaccurate, or not suitable for a community matrimony service.
        </p>

        <h2>3. Privacy of contact details</h2>
        <p>
          <strong>Mobile, WhatsApp, email and address are never public.</strong> They are visible
          only to (a) our admin team for verification and matchmaking, and (b) members who have an
          approved connection with you. Contact details are never included in browse or profile-list responses.
        </p>

        <h2>4. Profiles of the opposite gender only</h2>
        <p>
          Members can only browse profiles of the opposite gender. Every browse is recorded
          server-side; no third-party script accesses profiles.
        </p>

        <h2>5. Photography &amp; uploads</h2>
        <p>
          You may upload up to 6 profile photos and one kundli image (max 5 MB, JPG/PNG/WEBP).
          Deleting a photo removes it from the site. Do not upload anything you don't have the
          right to publish, and don't upload anyone else's photos without their permission.
        </p>

        <h2>6. Interest requests and connections</h2>
        <p>
          Interest requests are reviewed by the admin. At most, 5 pending requests may be active
          at the same time. When the admin approves, both members become connected and can see
          each other's contact details. Requests that are rejected cannot be sent again.
        </p>

        <h2>7. Notifications</h2>
        <p>
          All communications are delivered inside the website (no emails/SMS). Watch the bell
          icon on your dashboard.
        </p>

        <h2>8. Data storage</h2>
        <p>
          Account data and profiles are stored in a secure database (Supabase). Images are
          stored on Cloudinary. Passwords are stored only as salted hashes — never as
          plain text, and never returned by any API.
        </p>

        <h2>9. No guarantee</h2>
        <p>
          We work hard to keep profiles genuine, but this is a meeting platform — we cannot
          guarantee the accuracy of any profile, nor guarantee that any match will be found.
          Please use your own judgement, verify details directly with your approved matches
          and involve family in the final decision.
        </p>

        <h2>10. Changes</h2>
        <p>
          These terms may be updated for a better process. Registered members will receive an
          in-website notification of significant changes.
        </p>
      </div>
    </div>
  )
}
