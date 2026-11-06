/**
 * ⚠️ DEMO DATA ONLY — for TESTING, never for a live website. ⚠️
 *
 * Creates 4 approved demo users (2 grooms, 2 brides) with obviously fake
 * sample data so browsing/requests can be tested immediately.
 * - Emails end in @demo.example (fake domain)
 * - All passwords are: Demo@1234
 * - Re-running the script REPLACES the demo users (delete + recreate)
 * - Placeholder photos come from picsum.photos (not Cloudinary)
 *
 * Before going live: DELETE the demo users (see README "Before going live").
 *
 * Run with:  npm run seed:demo
 */
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

import { supabase } from '../config/supabase.js'

const DEMO_PASSWORD = 'Demo@1234'
const DEMO_EMAILS = [
  'ravi.kumar@demo.example',
  'suresh.rao@demo.example',
  'divya.reddy@demo.example',
  'swathi.ja@demo.example',
]

function dob(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const DEMO_USERS = [
  {
    user: { name: 'Ravi Kumar (Demo)', email: DEMO_EMAILS[0] },
    profile: {
      name: 'Ravi Kumar (Demo)',
      gender: 'male',
      date_of_birth: dob(1994, 4, 12),
      height_cm: 172,
      weight_kg: 68,
      marital_status: 'never_married',
      mother_tongue: 'Telugu',
      about_me: 'DEMO PROFILE — Simple sample data for testing. Software engineer from Hyderabad who enjoys cricket and travel.',
      caste: 'Padmashali',
      sub_caste_kulam: 'Padmashali - 5 Kulam',
      gotra: 'Sage Demo Gotra',
      highest_qualification: 'B.Tech',
      college: 'Demo Institute of Technology',
      field_of_study: 'Computer Science',
      occupation: 'Software Engineer',
      company: 'DemoSoft Pvt Ltd',
      annual_income: '12 - 15 LPA',
      diet: 'vegetarian',
      smoking: 'never',
      drinking: 'never',
      hobbies: 'Cricket, reading, travelling',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      willing_to_relocate: true,
      contact_mobile: '9990000001',
      contact_whatsapp: '9990000001',
      contact_email: 'ravi.kumar@demo.example',
      contact_address: 'DEMO address — Flat 101, Demo Colony, Hyderabad 500001',
    },
    horoscope: {
      time_of_birth: '10:30',
      place_of_birth: 'Hyderabad (demo)',
      rashi: 'Vrishabha',
      nakshatra: 'Rohini',
      pada: 2,
      graha_details: 'DEMO graha details — sample text only.',
      manglik: 'no',
    },
    family: {
      father_name: 'Demo Father Kumar',
      father_occupation: 'Weaver (retired)',
      mother_name: 'Demo Mother Kumar',
      mother_occupation: 'Homemaker',
      brothers: 1,
      sisters: 0,
      family_type: 'nuclear',
      family_values: 'traditional',
      native_place: 'Warangal (demo)',
    },
    preferences: {
      min_age: 21,
      max_age: 30,
      min_height_cm: 155,
      max_height_cm: 178,
      education: 'Graduate',
      location: 'Telangana / AP',
      marital_status: 'never_married',
    },
  },
  {
    user: { name: 'Suresh Rao (Demo)', email: DEMO_EMAILS[1] },
    profile: {
      name: 'Suresh Rao (Demo)',
      gender: 'male',
      date_of_birth: dob(1992, 9, 25),
      height_cm: 176,
      weight_kg: 72,
      marital_status: 'never_married',
      mother_tongue: 'Telugu',
      about_me: 'DEMO PROFILE — Simple sample data for testing. Bank manager from Vijayawada, family-oriented and easy-going.',
      caste: 'Padmashali',
      sub_caste_kulam: 'Padmashali - 7 Kulam',
      gotra: 'Demo Gupta',
      highest_qualification: 'MBA',
      college: 'Demo Business School',
      field_of_study: 'Finance',
      occupation: 'Bank Manager',
      company: 'Demo Bank',
      annual_income: '15 - 20 LPA',
      diet: 'vegetarian',
      smoking: 'never',
      drinking: 'occasionally',
      hobbies: 'Cooking, badminton',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      country: 'India',
      willing_to_relocate: false,
      contact_mobile: '9990000002',
      contact_whatsapp: '9990000002',
      contact_email: 'suresh.rao@demo.example',
      contact_address: 'DEMO address — House 7, Demo Street, Vijayawada 520001',
    },
    horoscope: {
      time_of_birth: '06:15',
      place_of_birth: 'Vijayawada (demo)',
      rashi: 'Simha',
      nakshatra: 'Magha',
      pada: 1,
      graha_details: 'DEMO graha details — sample text only.',
      manglik: 'not_sure',
    },
    family: {
      father_name: 'Demo Father Rao',
      father_occupation: 'Farmer',
      mother_name: 'Demo Mother Rao',
      mother_occupation: 'School teacher',
      brothers: 0,
      sisters: 2,
      family_type: 'joint',
      family_values: 'moderate',
      native_place: 'Guntur (demo)',
    },
    preferences: {
      min_age: 21,
      max_age: 32,
      min_height_cm: 150,
      max_height_cm: 175,
      education: 'Any',
      location: 'Any',
      marital_status: 'any',
    },
  },
  {
    user: { name: 'Divya Reddy (Demo)', email: DEMO_EMAILS[2] },
    profile: {
      name: 'Divya Reddy (Demo)',
      gender: 'female',
      date_of_birth: dob(1996, 2, 8),
      height_cm: 160,
      weight_kg: 55,
      marital_status: 'never_married',
      mother_tongue: 'Telugu',
      about_me: 'DEMO PROFILE — Simple sample data for testing. Doctor from Bengaluru who loves classical dance.',
      caste: 'Padmashali',
      sub_caste_kulam: 'Padmashali - 3 Kulam',
      gotra: 'Demo Gotra B',
      highest_qualification: 'MBBS',
      college: 'Demo Medical College',
      field_of_study: 'Medicine',
      occupation: 'Doctor',
      company: 'Demo Hospital',
      annual_income: '15 - 20 LPA',
      diet: 'vegetarian',
      smoking: 'never',
      drinking: 'never',
      hobbies: 'Kuchipudi dance, gardening',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      willing_to_relocate: true,
      contact_mobile: '9990000003',
      contact_whatsapp: '9990000003',
      contact_email: 'divya.reddy@demo.example',
      contact_address: 'DEMO address — Apt 12, Demo Layout, Bengaluru 560001',
    },
    horoscope: {
      time_of_birth: '14:45',
      place_of_birth: 'Bengaluru (demo)',
      rashi: 'Kumbha',
      nakshatra: 'Shatabhisha',
      pada: 3,
      graha_details: 'DEMO graha details — sample text only.',
      manglik: 'no',
    },
    family: {
      father_name: 'Demo Father Reddy',
      father_occupation: 'Businessman',
      mother_name: 'Demo Mother Reddy',
      mother_occupation: 'Homemaker',
      brothers: 0,
      sisters: 1,
      family_type: 'nuclear',
      family_values: 'moderate',
      native_place: 'Nizamabad (demo)',
    },
    preferences: {
      min_age: 26,
      max_age: 36,
      min_height_cm: 165,
      max_height_cm: 190,
      education: 'Post graduate',
      location: 'Any metro',
      marital_status: 'never_married',
    },
  },
  {
    user: { name: 'Swathi J (Demo)', email: DEMO_EMAILS[3] },
    profile: {
      name: 'Swathi J (Demo)',
      gender: 'female',
      date_of_birth: dob(1997, 11, 30),
      height_cm: 163,
      weight_kg: 52,
      marital_status: 'never_married',
      mother_tongue: 'Telugu',
      about_me: 'DEMO PROFILE — Simple sample data for testing. Teacher from Warangal, enjoys music and family gatherings.',
      caste: 'Padmashali',
      sub_caste_kulam: 'Padmashali - 5 Kulam',
      gotra: 'Demo Devi',
      highest_qualification: 'M.Sc',
      college: 'Demo University',
      field_of_study: 'Mathematics',
      occupation: 'Teacher',
      company: 'Demo High School',
      annual_income: '6 - 10 LPA',
      diet: 'vegetarian',
      smoking: 'never',
      drinking: 'never',
      hobbies: 'Carnatic music, painting',
      city: 'Warangal',
      state: 'Telangana',
      country: 'India',
      willing_to_relocate: false,
      contact_mobile: '9990000004',
      contact_whatsapp: '9990000004',
      contact_email: 'swathi.j@demo.example',
      contact_address: 'DEMO address — H.No 3-21, Demo Nagar, Warangal 506001',
    },
    horoscope: {
      time_of_birth: '05:50',
      place_of_birth: 'Warangal (demo)',
      rashi: 'Mithuna',
      nakshatra: 'Punarvasu',
      pada: 4,
      graha_details: 'DEMO graha details — sample text only.',
      manglik: 'no',
    },
    family: {
      father_name: 'Demo Father J',
      father_occupation: 'Tailor',
      mother_name: 'Demo Mother J',
      mother_occupation: 'Homemaker',
      brothers: 1,
      sisters: 1,
      family_type: 'extended',
      family_values: 'traditional',
      native_place: 'Warangal (demo)',
    },
    preferences: {
      min_age: 25,
      max_age: 34,
      min_height_cm: 168,
      max_height_cm: 185,
      education: 'Graduate',
      location: 'Telangana',
      marital_status: 'never_married',
    },
  },
]

// placeholder photos (NOT Cloudinary — just stable demo images)
const photoUrl = (seed) => `https://picsum.photos/seed/${seed}/300/400`

async function seedDemo() {
  console.log('⚠️  DEMO DATA — testing only. Users will be replaced on re-run.')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  // remove any previous demo users (cascades to profiles, photos, notifications…)
  const { data: old, error: delLookupError } = await supabase
    .from('users')
    .select('id, email')
    .in('email', DEMO_EMAILS)
  if (delLookupError) {
    console.error(`✗ Could not look up old demo users: ${delLookupError.message}`)
    process.exit(1)
  }
  if (old && old.length > 0) {
    const { error: delError } = await supabase.from('users').delete().in('email', DEMO_EMAILS)
    if (delError) {
      console.error(`✗ Could not delete old demo users: ${delError.message}`)
      process.exit(1)
    }
    console.log(`• Removed ${old.length} old demo user(s)`)
  }

  for (const [index, demo] of DEMO_USERS.entries()) {
    // account
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ ...demo.user, password_hash: passwordHash, role: 'user', is_active: true })
      .select('*')
      .single()
    if (userError) {
      console.error(`✗ ${demo.user.email}: ${userError.message}`)
      process.exit(1)
    }

    // approved profile with full data
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        ...demo.profile,
        profile_status: 'approved',
        completion_percent: 100,
      })
    if (profileError) {
      console.error(`✗ profile for ${demo.user.email}: ${profileError.message}`)
      process.exit(1)
    }

    const { error: horoError } = await supabase
      .from('horoscope_details')
      .insert({ user_id: user.id, ...demo.horoscope })
    if (horoError) console.warn(`! horoscope for ${user.email}: ${horoError.message}`)

    const { error: famError } = await supabase
      .from('family_details')
      .insert({ user_id: user.id, ...demo.family })
    if (famError) console.warn(`! family for ${user.email}: ${famError.message}`)

    const { error: prefError } = await supabase
      .from('partner_preferences')
      .insert({ user_id: user.id, ...demo.preferences })
    if (prefError) console.warn(`! preferences for ${user.email}: ${prefError.message}`)

    const { error: photoError } = await supabase
      .from('profile_photos')
      .insert({
        user_id: user.id,
        url: photoUrl(demo.user.email.split('@')[0]),
        public_id: null,
        is_main: true,
      })
    if (photoError) console.warn(`! photo for ${user.email}: ${photoError.message}`)

    console.log(`✓ ${demo.user.email} — password: ${DEMO_PASSWORD}`)
  }

  console.log('\n⚠️  Remember: delete these demo users before going live (README).')
  process.exit(0)
}

seedDemo()
