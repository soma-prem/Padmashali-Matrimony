import { SUBMIT_MIN_PERCENT } from '../../utils/profileOptions.js'
import { formatSiblingDetails } from '../../utils/family.js'

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function Row({ k, v }) {
  return (
    <div>
      <span className="k">{k}</span>
      <span className="v">{fmt(v)}</span>
    </div>
  )
}

function ReviewSection({ section, title, disabled, confirmed, onConfirm, onEdit, children }) {
  return (
    <section className="review-group">
      <div className="review-section-heading">
        <h4>{title}</h4>
        {!disabled && (
          <div className="review-section-actions">
            <button type="button" className="review-edit-button" onClick={() => onEdit(section)}
              aria-label={`Edit ${title}`} title={`Edit ${title}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </button>
            <label className="review-confirm">
              <input type="checkbox" checked={!!confirmed}
                onChange={(event) => onConfirm(section, event.target.checked)} />
              <span>{confirmed ? 'Confirmed' : 'Correct'}</span>
            </label>
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

export default function StepReview({
  profile = {},
  completionPercent = profile.completionPercent ?? 0,
  disabled,
  submitting,
  onSubmit,
  onEditSection,
  confirmedSections = {},
  onToggleSection,
  allSectionsConfirmed,
}) {
  const { basic = {}, community = {}, educationCareer = {}, lifestyleLocation = {},
    family = {}, horoscope = {}, contact = {} } = profile
  const photos = profile.photos || []

  const canSubmit =
    completionPercent >= SUBMIT_MIN_PERCENT && photos.length >= 1 && allSectionsConfirmed

  return (
    <div className="review-grid">
      <ReviewSection section="basic" title="Basic" disabled={disabled}
        confirmed={confirmedSections.basic} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Name" v={basic.name} /><Row k="Gender" v={basic.gender} />
          <Row k="Date of birth" v={basic.dateOfBirth} /><Row k="Height" v={basic.heightCm && `${basic.heightCm} cm`} />
          <Row k="Weight" v={basic.weightKg && `${basic.weightKg} kg`} />
          <Row k="Marital status" v={basic.maritalStatus} /><Row k="Mother tongue" v={basic.motherTongue} />
          <Row k="About me" v={basic.aboutMe} />
        </div>
      </ReviewSection>

      <ReviewSection section="community" title="Community" disabled={disabled}
        confirmed={confirmedSections.community} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Religion" v={community.religion} /><Row k="Caste" v={community.caste} />
          <Row k="Gotra" v={community.gotra} />
        </div>
      </ReviewSection>

      <ReviewSection section="educationCareer" title="Education & Career" disabled={disabled}
        confirmed={confirmedSections.educationCareer} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Qualification" v={educationCareer.highestQualification} />
          <Row k="College" v={educationCareer.college} />
          <Row k="Field" v={educationCareer.fieldOfStudy} />
          <Row k="Occupation" v={educationCareer.occupation} />
          <Row k="Company" v={educationCareer.company} />
          <Row k="Annual income" v={educationCareer.annualIncome} />
        </div>
      </ReviewSection>

      <ReviewSection section="family" title="Family" disabled={disabled}
        confirmed={confirmedSections.family} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Father" v={family.fatherName && `${family.fatherName}${family.fatherOccupation ? ` (${family.fatherOccupation})` : ''}`} />
          <Row k="Father's age" v={family.fatherAge} />
          <Row k="Mother" v={family.motherName && `${family.motherName}${family.motherOccupation ? ` (${family.motherOccupation})` : ''}`} />
          <Row k="Mother's age" v={family.motherAge} />
          <Row k="Brothers" v={family.brothers} />
          <Row k="Brother details" v={formatSiblingDetails(family.brotherDetails, family.brotherNames, "Wife")} />
          <Row k="Sisters" v={family.sisters} />
          <Row k="Sister details" v={formatSiblingDetails(family.sisterDetails, family.sisterNames, "Husband")} />
          <Row k="Native place" v={family.nativePlace} />
        </div>
      </ReviewSection>

      <ReviewSection section="horoscope" title="Horoscope" disabled={disabled}
        confirmed={confirmedSections.horoscope} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Time of birth" v={horoscope.timeOfBirth} /><Row k="Place of birth" v={horoscope.placeOfBirth} />
          <Row k="Rashi" v={horoscope.rashi} /><Row k="Nakshatra" v={horoscope.nakshatra} />
          <Row k="Pada" v={horoscope.pada} /><Row k="Manglik" v={horoscope.manglik} />
          <Row k="Graha details" v={horoscope.grahaDetails} />
          <Row k="Kundli image" v={horoscope.kundliImageUrl ? 'uploaded ✓' : 'not uploaded'} />
        </div>
      </ReviewSection>

      <ReviewSection section="lifestyleLocation" title="Lifestyle & Location" disabled={disabled}
        confirmed={confirmedSections.lifestyleLocation} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Diet" v={lifestyleLocation.diet} /><Row k="Smoking" v={lifestyleLocation.smoking} />
          <Row k="Drinking" v={lifestyleLocation.drinking} /><Row k="Hobbies" v={lifestyleLocation.hobbies} />
          <Row k="City" v={lifestyleLocation.city} /><Row k="State" v={lifestyleLocation.state} />
          <Row k="Country" v={lifestyleLocation.country} />
          <Row k="Willing to relocate" v={lifestyleLocation.willingToRelocate} />
          {lifestyleLocation.willingToRelocate && (
            <Row k="Preferred relocation location" v={lifestyleLocation.relocationLocation} />
          )}
        </div>
      </ReviewSection>

      <ReviewSection section="photos" title={`Photos (${photos.length})`} disabled={disabled}
        confirmed={confirmedSections.photos} onConfirm={onToggleSection} onEdit={onEditSection}>
        {photos.length > 0 ? (
          <div className="photo-grid" style={{ marginTop: 8 }}>
            {photos.map((p) => (
              <img key={p.id} src={p.url} alt="Photo" style={{
                width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 8,
              }} />
            ))}
          </div>
        ) : (
          <div className="review-list"><Row k="Photos" v="No photos uploaded" /></div>
        )}
      </ReviewSection>

      <ReviewSection section="contact" title="Contact Details" disabled={disabled}
        confirmed={confirmedSections.contact} onConfirm={onToggleSection} onEdit={onEditSection}>
        <div className="review-list">
          <Row k="Mobile" v={contact.mobile} />
          <Row k="WhatsApp" v={contact.whatsapp} />
          <Row k="Email" v={contact.email} />
          <Row k="Address" v={contact.address} />
        </div>
      </ReviewSection>

      {disabled ? (
        <div className="submit-block">
          <p>
            {profile.status === 'pending_approval' && '⏳ Your profile is under review by the admin.'}
            {profile.status === 'approved' && '✅ Your profile is approved.'}
          </p>
        </div>
      ) : (
        <div className="submit-block">
          <p>
            Before submitting: make sure everything above is correct.
            Contact details stay private until a match is approved.
          </p>
          {!canSubmit && (
            <p className="blocked">
              {!allSectionsConfirmed
                ? 'Confirm that every section is correct before submitting.'
                : completionPercent < SUBMIT_MIN_PERCENT
                  ? `You need at least ${SUBMIT_MIN_PERCENT}% completion (currently ${completionPercent}%).`
                  : 'Upload at least 1 photo before submitting.'}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSubmit || submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      )}
    </div>
  )
}
