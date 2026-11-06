import { AppError } from './AppError.js'

// ---------- allowed values ----------
export const GENDERS = ['male', 'female']
export const MARITAL_STATUSES = ['never_married', 'divorced', 'widowed', 'separated']
export const DIETS = ['vegetarian', 'non_vegetarian', 'eggetarian', 'occasionally']
export const HABITS = ['never', 'occasionally', 'regularly', 'quit']
export const FAMILY_TYPES = ['nuclear', 'joint', 'extended']
export const FAMILY_VALUES = ['traditional', 'moderate', 'liberal', 'spiritual']
export const MANGLIKS = ['yes', 'no', 'not_sure']
export const PREF_MARITAL = [...MARITAL_STATUSES, 'any']

export const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
]

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

// ---------- helpers ----------
const fail = (msg) => { throw new AppError(msg, 400) }

function cleanText(value, label, { required = false, min = 1, max = 200 } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) fail(`${label} is required.`)
    return null
  }
  const text = String(value).trim()
  if (text.length < min) fail(`${label} must be at least ${min} characters.`)
  if (text.length > max) fail(`${label} must be at most ${max} characters.`)
  return text
}

function cleanEnum(value, label, allowed) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim().toLowerCase()
  if (!allowed.includes(text)) fail(`${label}: invalid value "${value}".`)
  return text
}

function cleanNumber(value, label, { min, max } = {}) {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num)) fail(`${label} must be a number.`)
  if (min !== undefined && num < min) fail(`${label} must be at least ${min}.`)
  if (max !== undefined && num > max) fail(`${label} must be at most ${max}.`)
  return num
}

function cleanDate(value, label) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(`${label} must be a valid date.`)
  const date = new Date(`${text}T00:00:00`)
  if (Number.isNaN(date.getTime())) fail(`${label} must be a valid date.`)
  const today = new Date()
  const age = (today - date) / (365.25 * 24 * 3600 * 1000)
  if (age < 18) fail(`${label}: you must be at least 18 years old.`)
  if (age > 100) fail(`${label}: age cannot be more than 100.`)
  return text
}

function cleanPhone(value, label) {
  if (value === undefined || value === null || value === '') return null
  const digits = String(value).replace(/[\s\-()]/g, '')
  if (!/^\+?\d{10,15}$/.test(digits)) fail(`${label} must be 10–15 digits.`)
  return digits
}

function cleanEmail(value, label) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  if (text.length > 120) fail(`${label} is too long.`)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) fail(`${label} is not a valid email.`)
  return text.toLowerCase()
}

function cleanBool(value, label) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1) return true
  if (value === 'false' || value === 0) return false
  fail(`${label} must be yes or no.`)
}

function cleanTime(value, label) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) fail(`${label} must be a time like 14:30.`)
  return text
}

// ---------- section specs ----------
// map: camelCase key the client sends  ->  { column, clean }
const t = (column, opts) => ({ type: 'text', column, ...opts })
const e = (column, values) => ({ type: 'enum', column, values })
const n = (column, min, max) => ({ type: 'number', column, min, max })
const b = (column) => ({ type: 'bool', column })

export const SECTION_SPECS = {
  // -> public.profiles
  basic: {
    name: t('name', { min: 2, max: 80, required: true }),
    gender: e('gender', GENDERS),
    date_of_birth: { type: 'date', column: 'date_of_birth' },
    height_cm: n('height_cm', 100, 250),
    weight_kg: n('weight_kg', 30, 200),
    marital_status: e('marital_status', MARITAL_STATUSES),
    mother_tongue: t('mother_tongue', { max: 40 }),
    about_me: t('about_me', { max: 1200 }),
  },
  community: {
    caste: t('caste', { max: 60 }),
    sub_caste_kulam: t('sub_caste_kulam', { max: 60 }),
    gotra: t('gotra', { max: 60 }),
  },
  educationCareer: {
    highest_qualification: t('highest_qualification', { max: 120 }),
    college: t('college', { max: 120 }),
    field_of_study: t('field_of_study', { max: 120 }),
    occupation: t('occupation', { max: 120 }),
    company: t('company', { max: 120 }),
    annual_income: t('annual_income', { max: 60 }),
  },
  lifestyleLocation: {
    diet: e('diet', DIETS),
    smoking: e('smoking', HABITS),
    drinking: e('drinking', HABITS),
    hobbies: t('hobbies', { max: 300 }),
    city: t('city', { max: 80 }),
    state: t('state', { max: 80 }),
    country: t('country', { max: 80 }),
    willing_to_relocate: b('willing_to_relocate'),
  },
  contact: {
    contact_mobile: {
      type: 'phone', column: 'contact_mobile', label: 'Mobile number', required: true,
    },
    contact_whatsapp: { type: 'phone', column: 'contact_whatsapp', label: 'WhatsApp number' },
    contact_email: { type: 'email', column: 'contact_email', label: 'Email' },
    contact_address: t('contact_address', { max: 400 }),
  },

  // -> public.horoscope_details
  horoscope: {
    time_of_birth: { type: 'time', column: 'time_of_birth' },
    place_of_birth: t('place_of_birth', { max: 120 }),
    rashi: e('rashi', RASHIS),
    nakshatra: e('nakshatra', NAKSHATRAS),
    pada: n('pada', 1, 4),
    graha_details: t('graha_details', { max: 500 }),
    manglik: e('manglik', MANGLIKS),
  },

  // -> public.family_details
  family: {
    father_name: t('father_name', { max: 100 }),
    father_occupation: t('father_occupation', { max: 100 }),
    mother_name: t('mother_name', { max: 100 }),
    mother_occupation: t('mother_occupation', { max: 100 }),
    brothers: n('brothers', 0, 20),
    sisters: n('sisters', 0, 20),
    family_type: e('family_type', FAMILY_TYPES),
    family_values: e('family_values', FAMILY_VALUES),
    native_place: t('native_place', { max: 120 }),
  },

  // -> public.partner_preferences
  preferences: {
    min_age: n('min_age', 18, 100),
    max_age: n('max_age', 18, 100),
    min_height_cm: n('min_height_cm', 100, 250),
    max_height_cm: n('max_height_cm', 100, 250),
    education: t('education', { max: 120 }),
    location: t('location', { max: 120 }),
    marital_status: e('marital_status', PREF_MARITAL),
  },
}

/**
 * Which Supabase table does each section write to?
 * Several sections merge into public.profiles and must be combined
 * into ONE update (nothing is overwritten twice).
 */
export const SECTION_TARGETS = {
  basic: 'profiles',
  community: 'profiles',
  educationCareer: 'profiles',
  lifestyleLocation: 'profiles',
  contact: 'profiles',
  horoscope: 'horoscope_details',
  family: 'family_details',
  preferences: 'partner_preferences',
}

function defaultLabels() {
  return {}
}

const LABELS = Object.fromEntries(
  Object.entries(SECTION_SPECS).flatMap(([section, fields]) =>
    Object.entries(fields).map(([key, spec]) => [
      `${section}.${key}`,
      spec.label ||
        key
          .replace(/_/g, ' ')
          .replace(/^\w/, (c) => c.toUpperCase()),
    ])
  )
)

/**
 * Validates ONE section's partial input.
 * Returns a clean object keyed by DB column names.
 * Unknown fields are silently dropped — never forwarded to the DB.
 */
export function validateSection(section, input, labels = LABELS) {
  const spec = SECTION_SPECS[section]
  if (!spec) fail(`Unknown section "${section}".`)
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    fail(`Section "${section}" must be an object.`)
  }

  const cleaned = {}
  for (const [key, options] of Object.entries(spec)) {
    if (!(key in input)) continue // partial update — only provided fields are validated
    const item = { ...options, label: options.label || labels[`${section}.${key}`] }
    if (item.required && (input[key] === undefined || input[key] === null || input[key] === '')) {
      fail(`${item.label} is required.`)
    }
    switch (item.type) {
      case 'text': cleaned[item.column] = cleanText(input[key], item.label, item); break
      case 'enum': cleaned[item.column] = cleanEnum(input[key], item.label, item.values); break
      case 'number': cleaned[item.column] = cleanNumber(input[key], item.label, item); break
      case 'date': cleaned[item.column] = cleanDate(input[key], item.label); break
      case 'time': cleaned[item.column] = cleanTime(input[key], item.label); break
      case 'phone': cleaned[item.column] = cleanPhone(input[key], item.label); break
      case 'email': cleaned[item.column] = cleanEmail(input[key], item.label); break
      case 'bool': cleaned[item.column] = cleanBool(input[key], item.label); break
      default: fail(`Bad field spec for ${section}.${key}`)
    }
  }
  return cleaned
}

/**
 * Cross-field sanity checks across a complete saved profile
 * (preferences ranges). Used before submit.
 */
export function assertRangesConsistent(prefs) {
  if (!prefs) return
  if (prefs.min_age && prefs.max_age && prefs.min_age > prefs.max_age) {
    fail('Partner preference: minimum age cannot be more than maximum age.')
  }
  if (prefs.min_height_cm && prefs.max_height_cm && prefs.min_height_cm > prefs.max_height_cm) {
    fail('Partner preference: minimum height cannot be more than maximum height.')
  }
}
