import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { loadProfileSnapshot } from '../utils/profileSnapshot.js'
import {
  requireApprovedProfile,
  getRelationshipMap,
  getRelationship,
  checkConnected,
  stripContact,
  assertBrowseTarget,
} from '../utils/relations.js'

const PAGE_LIMIT = 12
const GENDER_IDS = ['male', 'female']

// date-of-birth bounds for min/max age filters (simple, ±1 day precision)
function dobBounds(minAge, maxAge) {
  const now = new Date()
  const bound = (years) => {
    const d = new Date(now.getFullYear() - years, now.getMonth(), now.getDate())
    return d.toISOString().split('T')[0]
  }
  return {
    bornBefore: minAge !== null ? bound(minAge) : null, // at least minAge years old
    bornAfter: maxAge !== null ? bound(maxAge + 1) : null, // at most maxAge years old
  }
}

function numberOr(value, min, max) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n) || n < min || n > max) return null
  return n
}

function textOr(value, max = 80) {
  const t = String(value || '').trim()
  if (!t) return null
  return t.slice(0, max).replace(/[%(,)]/g, '')
}

function ageFrom(dob) {
  if (!dob) return null
  const d = new Date(dob)
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)))
}

// ---------------------------------------------------------------------------
// GET /api/browse — approved, OPPOSITE gender, contact details NEVER included
// ---------------------------------------------------------------------------
export async function listBrowse(req, res, next) {
  try {
    const viewer = await requireApprovedProfile(req.user.id)
    const oppositeGender = viewer.gender === 'male' ? 'female' : 'male'

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const minAge = numberOr(req.query.minAge, 18, 100)
    const maxAge = numberOr(req.query.maxAge, 18, 100)
    const maritalStatus = textOr(req.query.maritalStatus, 30)
    const education = textOr(req.query.education, 120)
    const city = textOr(req.query.city, 80)
    const state = textOr(req.query.state, 80)
    const nakshatra = textOr(req.query.nakshatra, 40)
    const gotra = textOr(req.query.gotra, 60)

    const { bornBefore, bornAfter } = dobBounds(minAge, maxAge)

    // nakshatra/gotra live in horoscope_details -> pre-filter the user ids
    let allowedIds = null // null = no constraint
    if (nakshatra || gotra) {
      let q = supabase.from('horoscope_details').select('user_id')
      if (nakshatra) q = q.eq('nakshatra', nakshatra)
      if (gotra) q = q.ilike('gotra', `%${gotra}%`)
      const { data, error } = await q
      if (error) throw error
      allowedIds = data.map((r) => r.user_id)
      if (allowedIds.length === 0) {
        return res.json({
          success: true,
          data: { items: [], page, limit: PAGE_LIMIT, total: 0, totalPages: 1 },
        })
      }
    }

    const buildQuery = () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, name, gender, date_of_birth, height_cm, city, state, highest_qualification, occupation, marital_status, created_at, users!inner ( is_active )')
        .eq('profile_status', 'approved')
        .eq('payment_required', false)
        .eq('gender', oppositeGender)
        .neq('user_id', req.user.id)
        .eq('users.is_active', true)
      if (allowedIds) query = query.in('user_id', allowedIds)
      if (maritalStatus) query = query.eq('marital_status', maritalStatus)
      if (education) query = query.ilike('highest_qualification', `%${education}%`)
      if (city) query = query.ilike('city', `%${city}%`)
      if (state) query = query.ilike('state', `%${state}%`)
      if (bornBefore) query = query.lte('date_of_birth', bornBefore)
      if (bornAfter) query = query.gte('date_of_birth', bornAfter)
      return query.order('created_at', { ascending: false })
    }

    const { data: rows, error } = await buildQuery()
      .range((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT - 1)
    if (error) throw error

    const { count: total, error: countError } = await buildQuery()
      .select('id', { count: 'exact', head: true })
    if (countError) throw countError

    const userIds = rows.map((r) => r.user_id)

    const [horoRes, photoRes, relMap] = await Promise.all([
      userIds.length
        ? supabase.from('horoscope_details').select('user_id, nakshatra, gotra').in('user_id', userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase.from('profile_photos').select('user_id, url').in('user_id', userIds).eq('is_main', true)
        : Promise.resolve({ data: [], error: null }),
      getRelationshipMap(req.user.id, userIds),
    ])
    if (horoRes.error) throw horoRes.error
    if (photoRes.error) throw photoRes.error

    const horoByUser = Object.fromEntries((horoRes.data || []).map((h) => [h.user_id, h]))
    const photoByUser = Object.fromEntries((photoRes.data || []).map((p) => [p.user_id, p.url]))

    const items = rows.map((r) => ({
      profileId: r.id,
      userId: r.user_id,
      name: r.name,
      gender: r.gender,
      age: ageFrom(r.date_of_birth),
      heightCm: r.height_cm,
      city: r.city,
      state: r.state,
      education: r.highest_qualification,
      occupation: r.occupation,
      maritalStatus: r.marital_status,
      nakshatra: horoByUser[r.user_id]?.nakshatra ?? null,
      gotra: horoByUser[r.user_id]?.gotra ?? null,
      profilePhotoUrl: photoByUser[r.user_id] ?? null,
      relationship: relMap[r.user_id] ?? 'none',
    }))

    res.json({
      success: true,
      data: {
        items,
        page,
        limit: PAGE_LIMIT,
        total: total ?? 0,
        totalPages: Math.max(1, Math.ceil((total ?? 0) / PAGE_LIMIT)),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/browse/:profileId — full profile WITHOUT contact details,
// WITH contact details only when the viewer is connected to this user.
// Enforced here on the server, never only in the UI.
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
    assertBrowseTarget(targetProfile, viewer)

    const snapshot = await loadProfileSnapshot(targetProfile.user_id, { createIfMissing: false })

    const connected = await checkConnected(req.user.id, targetProfile.user_id)
    const relationship = await getRelationship(req.user.id, targetProfile.user_id)

    const data = stripContact(snapshot) // never leak by accident
    if (connected) {
      data.contact = snapshot.contact // only connected users get this
    }
    data.relationship = relationship
    data.connected = connected

    res.json({ success: true, data: { profile: data } })
  } catch (err) {
    next(err)
  }
}
