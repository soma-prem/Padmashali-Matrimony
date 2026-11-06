import { AppError } from './AppError.js'

// ---------- allowed values ----------
export const GENDERS = ['male', 'female']
export const MARITAL_STATUSES = ['never_married', 'divorced', 'widowed', 'separated']
export const RELIGIONS = ['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'other']
export const DIETS = ['vegetarian', 'non_vegetarian', 'eggetarian', 'occasionally']
export const HABITS = ['never', 'occasionally', 'regularly', 'quit']
export const FAMILY_TYPES = ['nuclear', 'joint', 'extended']
export const FAMILY_VALUES = ['traditional', 'moderate', 'liberal', 'spiritual']
export const MANGLIKS = ['yes', 'no', 'not_sure']
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
  const canonical = allowed.find((option) => option.toLowerCase() === text)
  if (!canonical) fail(`${label}: invalid value "${value}".`)
  return canonical
}

function cleanNumber(value, label, { min, max } = {}) {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num)) fail(`${label} must be a number.`)
  if (min !== undefined && num < min) fail(`${label} must be at least ${min}.`)
  if (max !== undefined && num > max) fail(`${label} must be at most ${max}.`)
  return num
}

function cleanInteger(value, label, { min, max } = {}) {
  const num = cleanNumber(value, label, { min, max })
  if (num !== null && !Number.isInteger(num)) fail(`${label} must be a whole number.`)
  return num
}

function cleanTextArray(value, label, { maxItems = 20, maxLength = 100 } = {}) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) fail(`${label} must be a list of names.`)
  if (value.length > maxItems) {
    fail(`${label} must contain no more than ${maxItems} names.`)
  }
  return value.map((item, index) => {
    if (typeof item !== 'string') fail(`${label} item ${index + 1} must be text.`)
    const text = item.trim()
    if (text.length > maxLength) {
      fail(`${label} item ${index + 1} must be at most ${maxLength} characters.`)
    }
    return text
  })
}

function cleanSiblingDetails(value, label, { maxItems = 20 } = {}) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) fail(`${label} must be a list.`)
  if (value.length > maxItems) fail(`${label} cannot contain more than ${maxItems} siblings.`)

  return value.map((sibling, index) => {
    if (!sibling || typeof sibling !== 'object' || Array.isArray(sibling)) {
      fail(`${label} item ${index + 1} must be an object.`)
    }

    const text = (key, max = 100) => {
      const field = sibling[key]
      if (field === undefined || field === null || field === '') return ''
      if (typeof field !== 'string') fail(`${label} item ${index + 1} ${key} must be text.`)
      const cleaned = field.trim()
      if (cleaned.length > max) fail(`${label} item ${index + 1} ${key} is too long.`)
      return cleaned
    }
    const age = (key) => {
      const field = sibling[key]
      if (field === undefined || field === null || field === '') return null
      const number = Number(field)
      if (!Number.isInteger(number) || number < 0 || number > 120) {
        fail(`${label} item ${index + 1} ${key} must be a whole number from 0 to 120.`)
      }
      return number
    }
    const maritalStatus = sibling.maritalStatus ?? ''
    if (!['', 'married', 'unmarried'].includes(maritalStatus)) {
      fail(`${label} item ${index + 1} has an invalid marital status.`)
    }

    return {
      name: text('name'),
      age: age('age'),
      occupation: text('occupation'),
      maritalStatus,
      spouseName: text('spouseName'),
      spouseAge: age('spouseAge'),
      spouseOccupation: text('spouseOccupation'),
    }
  })
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
const integer = (column, min, max) => ({ type: 'integer', column, min, max })
const b = (column) => ({ type: 'bool', column })
const a = (column, maxItems, maxLength) => ({ type: 'textArray', column, maxItems, maxLength })
const siblingArray = (column, maxItems) => ({ type: 'siblingArray', column, maxItems })

export const SECTION_SPECS = {
  // -> public.profiles
  basic: {
    name: t('name', { min: 2, max: 80, required: true }),
    gender: e('gender', GENDERS),
    dateOfBirth: { type: 'date', column: 'date_of_birth' },
    heightCm: n('height_cm', 100, 250),
    weightKg: n('weight_kg', 30, 200),
    maritalStatus: e('marital_status', MARITAL_STATUSES),
    motherTongue: t('mother_tongue', { max: 40 }),
    aboutMe: t('about_me', { max: 1200 }),
  },
  community: {
    religion: e('religion', RELIGIONS),
    caste: t('caste', { max: 60 }),
    subCasteKulam: t('sub_caste_kulam', { max: 60 }),
    gotra: t('gotra', { max: 60 }),
  },
  educationCareer: {
    highestQualification: t('highest_qualification', { max: 120 }),
    college: t('college', { max: 120 }),
    fieldOfStudy: t('field_of_study', { max: 120 }),
    occupation: t('occupation', { max: 120 }),
    company: t('company', { max: 120 }),
    annualIncome: t('annual_income', { max: 60 }),
  },
  lifestyleLocation: {
    diet: e('diet', DIETS),
    smoking: e('smoking', HABITS),
    drinking: e('drinking', HABITS),
    hobbies: t('hobbies', { max: 300 }),
    city: t('city', { max: 80 }),
    state: t('state', { max: 80 }),
    country: t('country', { max: 80 }),
    willingToRelocate: b('willing_to_relocate'),
    relocationLocation: t('relocation_location', { max: 120 }),
  },
  contact: {
    mobile: {
      type: 'phone', column: 'contact_mobile', label: 'Mobile number', required: true,
    },
    whatsapp: { type: 'phone', column: 'contact_whatsapp', label: 'WhatsApp number' },
    email: { type: 'email', column: 'contact_email', label: 'Email' },
    address: t('contact_address', { max: 400 }),
  },

  // -> public.horoscope_details
  horoscope: {
    timeOfBirth: { type: 'time', column: 'time_of_birth' },
    placeOfBirth: t('place_of_birth', { max: 120 }),
    rashi: e('rashi', RASHIS),
    nakshatra: e('nakshatra', NAKSHATRAS),
    pada: n('pada', 1, 4),
    grahaDetails: t('graha_details', { max: 500 }),
    manglik: e('manglik', MANGLIKS),
  },

  // -> public.family_details
  family: {
    fatherName: t('father_name', { max: 100 }),
    fatherOccupation: t('father_occupation', { max: 100 }),
    fatherAge: integer('father_age', 18, 120),
    motherName: t('mother_name', { max: 100 }),
    motherOccupation: t('mother_occupation', { max: 100 }),
    motherAge: integer('mother_age', 18, 120),
    brothers: integer('brothers', 0, 20),
    brotherNames: a('brother_names', 20, 100),
    brotherDetails: siblingArray('brother_details', 20),
    sisters: integer('sisters', 0, 20),
    sisterNames: a('sister_names', 20, 100),
    sisterDetails: siblingArray('sister_details', 20),
    familyType: e('family_type', FAMILY_TYPES),
    familyValues: e('family_values', FAMILY_VALUES),
    nativePlace: t('native_place', { max: 120 }),
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
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
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
    const inputKey = key in input ? key : options.column in input ? options.column : null
    if (inputKey === null) continue // partial update — only provided fields are validated
    const item = { ...options, label: options.label || labels[`${section}.${key}`] }
    if (item.required && (input[inputKey] === undefined || input[inputKey] === null || input[inputKey] === '')) {
      fail(`${item.label} is required.`)
    }
    switch (item.type) {
      case 'text': cleaned[item.column] = cleanText(input[inputKey], item.label, item); break
      case 'enum': cleaned[item.column] = cleanEnum(input[inputKey], item.label, item.values); break
      case 'number': cleaned[item.column] = cleanNumber(input[inputKey], item.label, item); break
      case 'integer': cleaned[item.column] = cleanInteger(input[inputKey], item.label, item); break
      case 'textArray': cleaned[item.column] = cleanTextArray(input[inputKey], item.label, item); break
      case 'siblingArray': cleaned[item.column] = cleanSiblingDetails(input[inputKey], item.label, item); break
      case 'date': cleaned[item.column] = cleanDate(input[inputKey], item.label); break
      case 'time': cleaned[item.column] = cleanTime(input[inputKey], item.label); break
      case 'phone': cleaned[item.column] = cleanPhone(input[inputKey], item.label); break
      case 'email': cleaned[item.column] = cleanEmail(input[inputKey], item.label); break
      case 'bool': cleaned[item.column] = cleanBool(input[inputKey], item.label); break
      default: fail(`Bad field spec for ${section}.${key}`)
    }
  }
  if (
    section === 'lifestyleLocation' &&
    cleaned.willing_to_relocate === true &&
    !cleaned.relocation_location
  ) {
    fail('Preferred relocation location is required when you are willing to relocate.')
  }
  return cleaned
}
