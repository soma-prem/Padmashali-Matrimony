import { SUBMIT_MIN_PERCENT } from '../../utils/profileOptions.js'

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

export default function StepReview({ profile = {}, disabled, submitting, submitError, onSubmit }) {
  const { basic = {}, community = {}, educationCareer = {}, lifestyleLocation = {},
    family = {}, horoscope = {}, preferences = {}, contact = {} } = profile
  const photos = profile.photos || []

  const canSubmit =
    profile.completionPercent >= SUBMIT_MIN_PERCENT && photos.length >= 1

  return (
    <div className="review-grid">
      <div className="review-group">
        <h4>Basic &amp; Community</h4>
        <div className="review-list">
          <Row k="Name" v={basic.name} /><Row k="Gender" v={basic.gender} />
          <Row k="Date of birth" v={basic.dateOfBirth} /><Row k="Height" v={basic.heightCm && `${basic.heightCm} cm`} />
          <Row k="Weight" v={basic.weightKg && `${basic.weightKg} kg`} />
          <Row k="Marital status" v={basic.maritalStatus} /><Row k="Mother tongue" v={basic.motherTongue} />
          <Row k="Caste" v={community.caste} /><Row k="Sub-caste / Kulam" v={community.subCasteKulam} />
          <Row k="Gotra" v={community.gotra} /><Row k="About me" v={basic.aboutMe} />
        </div>
      </div>

      <div className="review-group">
        <h4>Education &amp; Career</h4>
        <div className="review-list">
          <Row k="Qualification" v={educationCareer.highestQualification} />
          <Row k="College" v={educationCareer.college} />
          <Row k="Field" v={educationCareer.fieldOfStudy} />
          <Row k="Occupation" v={educationCareer.occupation} />
          <Row k="Company" v={educationCareer.company} />
          <Row k="Annual income" v={educationCareer.annualIncome} />
        </div>
      </div>

      <div className="review-group">
        <h4>Family</h4>
        <div className="review-list">
          <Row k="Father" v={family.fatherName && `${family.fatherName}${family.fatherOccupation ? ` (${family.fatherOccupation})` : ''}`} />
          <Row k="Mother" v={family.motherName && `${family.motherName}${family.motherOccupation ? ` (${family.motherOccupation})` : ''}`} />
          <Row k="Brothers" v={family.brothers} /><Row k="Sisters" v={family.sisters} />
          <Row k="Family type" v={family.familyType} /><Row k="Family values" v={family.familyValues} />
          <Row k="Native place" v={family.nativePlace} />
        </div>
      </div>

      <div className="review-group">
        <h4>Horoscope</h4>
        <div className="review-list">
          <Row k="Time of birth" v={horoscope.timeOfBirth} /><Row k="Place of birth" v={horoscope.placeOfBirth} />
          <Row k="Rashi" v={horoscope.rashi} /><Row k="Nakshatra" v={horoscope.nakshatra} />
          <Row k="Pada" v={horoscope.pada} /><Row k="Manglik" v={horoscope.manglik} />
          <Row k="Kundli image" v={horoscope.kundliImageUrl ? 'uploaded ✓' : 'not uploaded'} />
        </div>
      </div>

      <div className="review-group">
        <h4>Lifestyle &amp; Location</h4>
        <div className="review-list">
          <Row k="Diet" v={lifestyleLocation.diet} /><Row k="Smoking" v={lifestyleLocation.smoking} />
          <Row k="Drinking" v={lifestyleLocation.drinking} /><Row k="Hobbies" v={lifestyleLocation.hobbies} />
          <Row k="City" v={lifestyleLocation.city} /><Row k="State" v={lifestyleLocation.state} />
          <Row k="Country" v={lifestyleLocation.country} />
          <Row k="Willing to relocate" v={lifestyleLocation.willingToRelocate} />
        </div>
      </div>

      <div className="review-group">
        <h4>Partner Preferences</h4>
        <div className="review-list">
          <Row k="Age range" v={preferences.minAge && `${preferences.minAge} – ${preferences.maxAge ?? '?'} years`} />
          <Row k="Height range" v={preferences.minHeightCm && `${preferences.minHeightCm} – ${preferences.maxHeightCm ?? '?'} cm`} />
          <Row k="Education" v={preferences.education} />
          <Row k="Location" v={preferences.location} />
          <Row k="Marital status" v={preferences.maritalStatus} />
        </div>
      </div>

      <div className="review-group">
        <h4>Photos ({photos.length})</h4>
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
      </div>

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
              {profile.completionPercent < SUBMIT_MIN_PERCENT
                ? `You need at least ${SUBMIT_MIN_PERCENT}% completion (currently ${profile.completionPercent}%).`
                : 'Upload at least 1 photo before submitting.'}
            </p>
          )}
          {submitError && <p className="blocked" role="alert">{submitError}</p>}
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
