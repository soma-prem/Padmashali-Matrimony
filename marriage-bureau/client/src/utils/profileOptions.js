// Dropdown option lists for the Profile form.
// Values match the backend enums EXACTLY (unable to be edited).

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export const MARITAL_OPTIONS = [
  { value: 'never_married', label: 'Never married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
]

export const MOTHER_TONGUE_OPTIONS = [
  'Telugu', 'Tamil', 'Kannada', 'Hindi', 'Marathi', 'English',
]

export const CASTE_OPTIONS = [
  'Padmashali',
  'Devanga',
  'Brahmin',
  'Kshatriya',
  'Reddy',
  'Kamma',
  'Kapu',
  'Velama',
  'Vysya',
  'Yadav',
  'Mudiraj',
  'Goud',
  'Chakali',
  'Mangali',
  'Other',
]

// sub-caste / kulam options shown when caste is Padmashali or Devanga;
// for any other caste a free-text box appears.
export const SUBCASTE_PADMASHALI = [
  'Padmashali - 3 Kulam',
  'Padmashali - 5 Kulam',
  'Padmashali - 7 Kulam',
  'Padmasale',
  'Jandra',
  'Other',
]

export const SUBCASTE_DEVANGA = [
  'Devanga - Motati',
  'Devanga - Baliga',
  'Devanga - Kodekal',
  'Other',
]

export const RASHI_OPTIONS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
]

export const NAKSHATRA_OPTIONS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

export const PADA_OPTIONS = [1, 2, 3, 4]

export const MANGLIK_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "Don't know" },
]

export const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'occasionally', label: 'Occasionally non-veg' },
]

export const HABIT_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'regularly', label: 'Regularly' },
  { value: 'quit', label: 'Quit' },
]

export const FAMILY_TYPE_OPTIONS = [
  { value: 'nuclear', label: 'Nuclear' },
  { value: 'joint', label: 'Joint' },
  { value: 'extended', label: 'Extended' },
]

export const FAMILY_VALUES_OPTIONS = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'liberal', label: 'Liberal' },
  { value: 'spiritual', label: 'Spiritual' },
]

export const PREF_MARITAL_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'never_married', label: 'Never married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
]

export const SUBMIT_MIN_PERCENT = 80
