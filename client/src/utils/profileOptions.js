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

export const RELIGION_OPTIONS = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'jain', label: 'Jain' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'other', label: 'Other' },
]

export const CASTE_OPTIONS_BY_RELIGION = {
  hindu: [
    'Padmashali', 'Devanga', 'Brahmin', 'Kshatriya', 'Reddy', 'Kamma',
    'Kapu', 'Velama', 'Vysya', 'Yadav', 'Mudiraj', 'Goud', 'Chakali', 'Mangali',
  ],
  muslim: ['Syed', 'Sheikh', 'Pathan', 'Mughal', 'Ansari', 'Qureshi'],
  christian: ['Syrian Christian', 'Latin Christian', 'Dalit Christian', 'Anglo-Indian', 'Goan Christian'],
  sikh: ['Jat Sikh', 'Khatri', 'Arora', 'Ramgarhia', 'Mazhabi Sikh', 'Ramdasia Sikh'],
  jain: ['Oswal', 'Agarwal', 'Khandelwal', 'Porwal', 'Shrimal'],
  buddhist: ['Mahar', 'Navayana Buddhist', 'Tibetan Buddhist', 'Other Buddhist community'],
  other: [],
}

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

export const SUBMIT_MIN_PERCENT = 70
