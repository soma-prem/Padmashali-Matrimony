import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/api.js'
import { formatSiblingDetails } from '../utils/family.js'
import { useLanguage } from '../context/LanguageContext.jsx'

function Row({ k, v }) {
  const { t } = useLanguage()
  const text = v === null || v === undefined || v === '' ? '—'
    : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
  return <div><span className="k">{t(k)}</span><span className="v">{text}</span></div>
}

function Group({ title, rows, children, profileId }) {
  const { t } = useLanguage()
  return (
    <div className="review-group browse-detail-group">
      <div className="browse-detail-group-heading">
        <h4>{t(title)}</h4>
        {profileId && <span>{t('Profile ID')}: {profileId.slice(0, 8).toUpperCase()}</span>}
      </div>
      <div className="review-list">
        {rows.map(([label, value]) => <Row key={label} k={label} v={value} />)}
        {children}
      </div>
    </div>
  )
}

export default function BrowseDetail() {
  const { t } = useLanguage()
  const { profileId } = useParams()
  const [activeCategory, setActiveCategory] = useState('basic')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api(`/browse/${profileId}`)
      setProfile(data.data.profile)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="page-loading">{t('Loading profile…')}</div>
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p className="form-error">{error}</p>
          <Link to="/browse" className="btn btn-outline">← {t('Back to assigned matches')}</Link>
        </div>
      </div>
    )
  }

  const photos = profile.photos || []
  const mainPhotoUrl = photos[0]?.url
  const galleryPhotos = photos.filter((photo, index, all) =>
    photo.url &&
    photo.url !== mainPhotoUrl &&
    all.findIndex((candidate) => candidate.url === photo.url) === index
  )
  const basic = profile.basic ?? {}
  const community = profile.community ?? {}
  const edu = profile.educationCareer ?? {}
  const family = profile.family ?? {}
  const horo = profile.horoscope ?? {}
  const lifestyle = profile.lifestyleLocation ?? {}
  const contact = profile.contact ?? {}

  const age = basic.dateOfBirth
    ? Math.max(0, Math.floor((Date.now() - new Date(basic.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)))
    : null

  return (
    <div className="dashboard-page">
      <div className="dashboard-card wide">
        <div style={{ marginBottom: 12 }}>
          <Link to="/browse" className="btn btn-outline btn-sm">← {t('Back to assigned matches')}</Link>
        </div>

        {/* hero */}
        <div className="detail-hero">
          {mainPhotoUrl ? (
            <img className="detail-avatar" src={mainPhotoUrl} alt={`${basic.name || 'Profile'} main photo`} />
          ) : (
            <div className="detail-avatar" style={{ display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 800, color: 'var(--primary-deep)' }}>
              {(basic.name || '?').slice(0, 1)}
            </div>
          )}
          <div className="detail-headline">
            <h1 className="detail-name">{basic.name}</h1>
            <p className="detail-sub">
              {[
                basic.gender === 'male' ? 'Male' : 'Female',
                age ? `${age} yrs` : null,
                basic.heightCm ? `${basic.heightCm} cm` : null,
                [lifestyle.city, lifestyle.state].filter(Boolean).join(', ') || null,
              ].filter(Boolean).join(' • ')}
            </p>
            <p className="detail-sub">
              {edu.highestQualification ? `${edu.highestQualification}${edu.occupation ? ` • ${edu.occupation}` : ''}` : ''}
            </p>
          </div>
        </div>

        {/* photo gallery */}
        {galleryPhotos.length > 0 && (
          <section className="detail-gallery-section" aria-label="Additional profile photos">
            <h2 className="detail-gallery-title">{t('More photos')}</h2>
            <div className="detail-gallery">
              {galleryPhotos.map((p) => <img key={p.id} src={p.url} alt={`${basic.name || 'Profile'} photo`} />)}
            </div>
          </section>
        )}

        <div className="detail-assigned-note">
          ✅ {t('This match was assigned by the admin. Contact details are available below.')}
        </div>

        <div className="admin-contact-box">
            <h4>{t('Assigned match contact details')}</h4>
            <div className="review-list">
              <Row k="Mobile" v={contact.mobile} />
              <Row k="WhatsApp" v={contact.whatsapp} />
              <Row k="Email" v={contact.email} />
              <Row k="Address" v={contact.address} />
            </div>
        </div>

        <div className="browse-detail-categories">
          <div className="browse-detail-tabs" role="tablist" aria-label={t('Profile information categories')}>
            {[
              { id: 'basic', label: 'Basic' },
              { id: 'community', label: 'Community' },
              { id: 'horoscope', label: 'Horoscope' },
              { id: 'education', label: 'Education & Career' },
              { id: 'family', label: 'Family' },
              { id: 'lifestyle', label: 'Lifestyle' },
            ].map((category, categoryIndex) => (
              <button
                key={category.id}
                id={`profile-tab-${category.id}`}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                aria-controls={`profile-panel-${category.id}`}
                tabIndex={activeCategory === category.id ? 0 : -1}
                className={`browse-detail-tab${activeCategory === category.id ? ' is-active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                  event.preventDefault()
                  const direction = event.key === 'ArrowRight' ? 1 : -1
                  const nextCategory = event.currentTarget.parentElement.children[
                    (categoryIndex + direction + 6) % 6
                  ]
                  nextCategory.focus()
                  nextCategory.click()
                }}
              >
                {t(category.label)}
              </button>
            ))}
          </div>

          <section
            id="profile-panel-basic"
            className="browse-detail-panel"
            role="tabpanel"
            aria-labelledby="profile-tab-basic"
            hidden={activeCategory !== 'basic'}
          >
            <Group title="Basic details" profileId={profile.profileId} rows={[
              ['Gender', basic.gender],
              ['Date of birth', basic.dateOfBirth],
              ['Height', basic.heightCm && `${basic.heightCm} cm`],
              ['Weight', basic.weightKg && `${basic.weightKg} kg`],
              ['Marital status', basic.maritalStatus],
              ['Mother tongue', basic.motherTongue],
              ['About me', basic.aboutMe],
            ]} />
          </section>

          <section
            id="profile-panel-community"
            className="browse-detail-panel"
            role="tabpanel"
            aria-labelledby="profile-tab-community"
            hidden={activeCategory !== 'community'}
          >
            <Group title="Community details" rows={[
              ['Religion', community.religion],
              ['Caste / Sub-caste', [community.caste, community.subCasteKulam].filter(Boolean).join(' / ')],
              ['Gotra', community.gotra],
            ]} />
          </section>

          <section
            id="profile-panel-horoscope"
            className="browse-detail-panel"
            role="tabpanel"
            aria-labelledby="profile-tab-horoscope"
            hidden={activeCategory !== 'horoscope'}
          >
            <Group title="Horoscope details" rows={[
              ['Time of birth', horo.timeOfBirth],
              ['Place of birth', horo.placeOfBirth],
              ['Rashi', horo.rashi],
              ['Nakshatra', horo.nakshatra],
              ['Pada', horo.pada],
              ['Manglik', horo.manglik],
              ['Graha details', horo.grahaDetails],
            ]}>
              {horo.kundliImageUrl && (
                <div className="detail-kundli">
                  <h5>{t('Kundli image')}</h5>
                  <a href={horo.kundliImageUrl} target="_blank" rel="noreferrer">
                    <img src={horo.kundliImageUrl} alt={`${basic.name || 'Profile'} Kundli chart`} loading="lazy" />
                  </a>
                </div>
              )}
            </Group>
          </section>

          <section
            id="profile-panel-education"
            className="browse-detail-panel"
            role="tabpanel"
            aria-labelledby="profile-tab-education"
            hidden={activeCategory !== 'education'}
          >
            <Group title="Education & Career details" rows={[
              ['Qualification', edu.highestQualification],
              ['College', edu.college],
              ['Field of study', edu.fieldOfStudy],
              ['Occupation', edu.occupation],
              ['Company', edu.company],
              ['Annual income', edu.annualIncome],
            ]} />
          </section>

          <section
            id="profile-panel-lifestyle"
            className="browse-detail-panel"
            role="tabpanel"
            aria-labelledby="profile-tab-lifestyle"
            hidden={activeCategory !== 'lifestyle'}
          >
            <Group title="Lifestyle details" rows={[
              ['Diet', lifestyle.diet],
              ['Smoking', lifestyle.smoking],
              ['Drinking', lifestyle.drinking],
              ['Hobbies', lifestyle.hobbies],
              ['City', lifestyle.city],
              ['State', lifestyle.state],
              ['Country', lifestyle.country],
              ['Willing to relocate', lifestyle.willingToRelocate],
              ['Relocation location', lifestyle.relocationLocation],
            ]} />
          </section>

          <section
            id="profile-panel-family"
            className="browse-detail-panel"
            role="tabpanel"
            aria-labelledby="profile-tab-family"
            hidden={activeCategory !== 'family'}
          >
            <Group title="Family details" rows={[
              ['Father', family.fatherName && `${family.fatherName}${family.fatherOccupation ? ` (${family.fatherOccupation})` : ''}`],
              ["Father's age", family.fatherAge],
              ['Mother', family.motherName && `${family.motherName}${family.motherOccupation ? ` (${family.motherOccupation})` : ''}`],
              ["Mother's age", family.motherAge],
              ['Brothers', family.brothers],
              ['Brother details', formatSiblingDetails(family.brotherDetails, family.brotherNames, 'Wife')],
              ['Sisters', family.sisters],
              ['Sister details', formatSiblingDetails(family.sisterDetails, family.sisterNames, 'Husband')],
              ['Native place', family.nativePlace],
              ['Family type', family.familyType],
              ['Family values', family.familyValues],
            ]} />
          </section>
        </div>
      </div>
    </div>
  )
}
