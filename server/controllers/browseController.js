import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { loadProfileSnapshot } from '../utils/profileSnapshot.js'
import {
  requireApprovedProfile,
  assertAssignedMatchTarget,
} from '../utils/profileAccess.js'

function ageFrom(dob) {
  if (!dob) return null
  const d = new Date(dob)
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)))
}

// ---------------------------------------------------------------------------
// GET /api/browse — only the member's admin-assigned match
// ---------------------------------------------------------------------------
export async function listBrowse(req, res, next) {
  try {
    const viewer = await requireApprovedProfile(req.user.id)
    const oppositeGender = viewer.gender === 'male' ? 'female' : 'male'

    const { data: assignment, error: assignmentError } = await supabase
      .from('profile_assignments')
      .select('bride_user_id, groom_user_id')
      .or(`bride_user_id.eq.${req.user.id},groom_user_id.eq.${req.user.id}`)
      .maybeSingle()
    if (assignmentError) throw assignmentError

    if (!assignment) {
      return res.json({
        success: true,
        data: { items: [], assignedMatch: null, hasAssignment: false, total: 0 },
      })
    }

    const assignedPartnerId = assignment.bride_user_id === req.user.id
      ? assignment.groom_user_id
      : assignment.bride_user_id
    const [activeUserRes, verifiedPaymentRes, profileRes] = await Promise.all([
      supabase
        .from('users')
        .select('id')
        .eq('id', assignedPartnerId)
        .eq('role', 'user')
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('membership_payments')
        .select('user_id')
        .eq('user_id', assignedPartnerId)
        .eq('status', 'verified')
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, user_id, name, gender, date_of_birth, height_cm, city, state, highest_qualification, occupation, marital_status, gotra')
        .eq('user_id', assignedPartnerId)
        .eq('profile_status', 'approved')
        .eq('payment_required', false)
        .eq('gender', oppositeGender)
        .maybeSingle(),
    ])
    if (activeUserRes.error) throw activeUserRes.error
    if (verifiedPaymentRes.error) throw verifiedPaymentRes.error
    if (profileRes.error) throw profileRes.error

    const profile = profileRes.data
    if (!activeUserRes.data || !verifiedPaymentRes.data || !profile) {
      return res.json({
        success: true,
        data: { items: [], assignedMatch: null, hasAssignment: true, total: 0 },
      })
    }

    const [horoRes, photoRes] = await Promise.all([
      supabase
        .from('horoscope_details')
        .select('user_id, nakshatra')
        .eq('user_id', assignedPartnerId)
        .maybeSingle(),
      supabase
        .from('profile_photos')
        .select('user_id, url')
        .eq('user_id', assignedPartnerId)
        .eq('is_main', true)
        .maybeSingle(),
    ])
    if (horoRes.error) throw horoRes.error
    if (photoRes.error) throw photoRes.error

    const assignedMatch = {
      profileId: profile.id,
      userId: profile.user_id,
      name: profile.name,
      gender: profile.gender,
      age: ageFrom(profile.date_of_birth),
      heightCm: profile.height_cm,
      city: profile.city,
      state: profile.state,
      education: profile.highest_qualification,
      occupation: profile.occupation,
      maritalStatus: profile.marital_status,
      nakshatra: horoRes.data?.nakshatra ?? null,
      gotra: profile.gotra ?? null,
      profilePhotoUrl: photoRes.data?.url ?? null,
    }

    res.json({
      success: true,
      data: { items: [assignedMatch], assignedMatch, hasAssignment: true, total: 1 },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/browse/:profileId — the assigned partner's full profile and contact details.
// The assignment is verified on the server before any contact data is returned.
// ---------------------------------------------------------------------------
export async function getBrowseDetail(req, res, next) {
  try {
    const viewer = await requireApprovedProfile(req.user.id)
    const profileId = req.params.profileId
    if (!/^[0-9a-fA-F-]{36}$/.test(profileId)) {
      throw new AppError('Invalid profile id.', 400)
    }

    const { data: targetProfile, error: findError } = await supabase
      .from('profiles')
      .select('id, user_id, gender, profile_status, payment_required')
      .eq('id', profileId)
      .maybeSingle()
    if (findError) throw findError
    assertAssignedMatchTarget(targetProfile, viewer)

    const [assignmentRes, paymentRes, userRes] = await Promise.all([
      supabase
        .from('profile_assignments')
        .select('id')
        .or(
          `and(bride_user_id.eq.${req.user.id},groom_user_id.eq.${targetProfile.user_id}),` +
          `and(groom_user_id.eq.${req.user.id},bride_user_id.eq.${targetProfile.user_id})`
        )
        .maybeSingle(),
      supabase
        .from('membership_payments')
        .select('id')
        .eq('user_id', targetProfile.user_id)
        .eq('status', 'verified')
        .maybeSingle(),
      supabase
        .from('users')
        .select('id')
        .eq('id', targetProfile.user_id)
        .eq('role', 'user')
        .eq('is_active', true)
        .maybeSingle(),
    ])
    if (assignmentRes.error) throw assignmentRes.error
    if (paymentRes.error) throw paymentRes.error
    if (userRes.error) throw userRes.error
    if (!assignmentRes.data) {
      throw new AppError('This profile is not available.', 404)
    }
    if (!paymentRes.data || !userRes.data) {
      throw new AppError('This profile is not available.', 404)
    }

    const snapshot = await loadProfileSnapshot(targetProfile.user_id, { createIfMissing: false })

    const data = { ...snapshot, assigned: true }

    res.json({ success: true, data: { profile: data } })
  } catch (err) {
    next(err)
  }
}
