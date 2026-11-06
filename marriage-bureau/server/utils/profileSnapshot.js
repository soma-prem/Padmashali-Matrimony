import { supabase } from '../config/supabase.js'
import { AppError } from './AppError.js'
import { computeCompletion } from './completion.js'

async function insertEmptyProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function updateCompletion(userId, percent) {
  const { error } = await supabase
    .from('profiles')
    .update({ completion_percent: percent })
    .eq('user_id', userId)
  if (error) throw error
}

/**
 * Loads every piece of a profile and composes the API response.
 * Also persists the recalculated completion percent.
 *
 * - Users: use { createIfMissing: true } (their GET /me auto-creates a draft).
 * - Admin: use { createIfMissing: false } — missing profile -> 404.
 */
export async function loadProfileSnapshot(userId, { createIfMissing = true } = {}) {
  const [profileRes, horoRes, familyRes, prefsRes, photosRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('horoscope_details').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('family_details').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('partner_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profile_photos').select('*').eq('user_id', userId)
      .order('is_main', { ascending: false })
      .order('created_at', { ascending: true }),
  ])
  for (const res of [profileRes, horoRes, familyRes, prefsRes, photosRes]) {
    if (res.error) throw res.error
  }

  let profileRow = profileRes.data
  if (!profileRow) {
    if (!createIfMissing) {
      throw new AppError('Profile not found for this user.', 404)
    }
    profileRow = await insertEmptyProfile(userId)
  }

  const photos = (photosRes.data || []).map((p) => ({
    id: p.id,
    url: p.url,
    isMain: p.is_main,
    createdAt: p.created_at,
  }))

  const p = profileRow
  const horo = horoRes.data
  const fam = familyRes.data
  const prefs = prefsRes.data

  const snapshot = {
    profileId: p.id,
    userId: p.user_id,
    status: p.profile_status,
    completionPercent: p.completion_percent,
    rejectionReason: p.rejection_reason,
    updatedAt: p.updated_at,
    basic: {
      name: p.name,
      gender: p.gender,
      dateOfBirth: p.date_of_birth,
      heightCm: p.height_cm,
      weightKg: p.weight_kg,
      maritalStatus: p.marital_status,
      motherTongue: p.mother_tongue,
      aboutMe: p.about_me,
    },
    community: {
      caste: p.caste,
      subCasteKulam: p.sub_caste_kulam,
      gotra: p.gotra,
    },
    educationCareer: {
      highestQualification: p.highest_qualification,
      college: p.college,
      fieldOfStudy: p.field_of_study,
      occupation: p.occupation,
      company: p.company,
      annualIncome: p.annual_income,
    },
    lifestyleLocation: {
      diet: p.diet,
      smoking: p.smoking,
      drinking: p.drinking,
      hobbies: p.hobbies,
      city: p.city,
      state: p.state,
      country: p.country,
      willingToRelocate: p.willing_to_relocate,
    },
    contact: {
      mobile: p.contact_mobile,
      whatsapp: p.contact_whatsapp,
      email: p.contact_email,
      address: p.contact_address,
    },
    horoscope: horo
      ? {
          timeOfBirth: horo.time_of_birth,
          placeOfBirth: horo.place_of_birth,
          rashi: horo.rashi,
          nakshatra: horo.nakshatra,
          pada: horo.pada,
          grahaDetails: horo.graha_details,
          manglik: horo.manglik,
          kundliImageUrl: horo.kundli_image_url,
        }
      : null,
    family: fam
      ? {
          fatherName: fam.father_name,
          fatherOccupation: fam.father_occupation,
          motherName: fam.mother_name,
          motherOccupation: fam.mother_occupation,
          brothers: fam.brothers,
          sisters: fam.sisters,
          familyType: fam.family_type,
          familyValues: fam.family_values,
          nativePlace: fam.native_place,
        }
      : null,
    preferences: prefs
      ? {
          minAge: prefs.min_age,
          maxAge: prefs.max_age,
          minHeightCm: prefs.min_height_cm,
          maxHeightCm: prefs.max_height_cm,
          education: prefs.education,
          location: prefs.location,
          maritalStatus: prefs.marital_status,
        }
      : null,
    photos,
  }

  const percent = computeCompletion(snapshot, photos.length)
  if (p.completion_percent !== percent) {
    await updateCompletion(userId, percent)
  }
  snapshot.completionPercent = percent

  return snapshot
}
