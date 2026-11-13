import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { createNotification } from '../utils/notifications.js'
import { loadProfileSnapshot } from '../utils/profileSnapshot.js'
const VALID_PROFILE_STATUSES = ['pending_approval', 'approved', 'rejected', 'draft']
const INITIAL_UNIQUE_VISITORS = 11

// ------------------------------------------------------------------
// GET /api/admin/stats
// ------------------------------------------------------------------
export async function getStats(req, res, next) {
  try {
    const [
      usersTotal,
      totalProfiles,
      pendingProfiles,
      approvedProfiles,
      pendingPayments,
      uniqueVisitors,
    ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('profile_status', 'pending_approval'),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('profile_status', 'approved'),
        supabase.from('membership_payments').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('site_visitors').select('visitor_id', { count: 'exact', head: true }),
      ])

    for (const r of [usersTotal, totalProfiles, pendingProfiles, approvedProfiles, pendingPayments, uniqueVisitors]) {
      if (r.error) throw r.error
    }

    res.json({
      success: true,
      data: {
        totalUsers: usersTotal.count ?? 0,
        totalProfiles: totalProfiles.count ?? 0,
        pendingProfiles: pendingProfiles.count ?? 0,
        approvedProfiles: approvedProfiles.count ?? 0,
        pendingPayments: pendingPayments.count ?? 0,
        uniqueVisitors: INITIAL_UNIQUE_VISITORS + (uniqueVisitors.count ?? 0),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// GET /api/admin/profiles?status=&gender=&search=&page=
// Paginated profile list (with account info + main photo)
// ------------------------------------------------------------------
const ADMIN_STATUSES = VALID_PROFILE_STATUSES
const ADMIN_GENDERS = ['male', 'female']
const PAGE_LIMIT = 10

export async function listProfiles(req, res, next) {
  try {
    const { status, gender, search } = req.query
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const eligibleOnly = req.query.eligible === 'true'

    const filters = {}
    if (status && ADMIN_STATUSES.includes(status)) filters.status = status
    if (gender && ADMIN_GENDERS.includes(gender)) filters.gender = gender

    const q = String(search || '').trim().slice(0, 80)
    const searchSafe = q.replace(/[%(),]/g, ' ').trim()
    let searchUserIds = null

    if (q && !searchSafe) {
      searchUserIds = []
    } else if (searchSafe) {
      const pattern = `%${searchSafe}%`
      const [profileSearch, accountNameSearch, emailSearch] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id')
          .ilike('name', pattern),
        supabase
          .from('users')
          .select('id')
          .eq('role', 'user')
          .ilike('name', pattern),
        supabase
          .from('users')
          .select('id')
          .eq('role', 'user')
          .ilike('email', pattern),
      ])
      if (profileSearch.error) throw profileSearch.error
      if (accountNameSearch.error) throw accountNameSearch.error
      if (emailSearch.error) throw emailSearch.error

      searchUserIds = [...new Set([
        ...(profileSearch.data || []).map((row) => row.user_id),
        ...(accountNameSearch.data || []).map((row) => row.id),
        ...(emailSearch.data || []).map((row) => row.id),
      ])]

    }

    let eligibleUserIds = null
    if (eligibleOnly) {
      const [usersRes, paymentsRes] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'user').eq('is_active', true),
        supabase.from('membership_payments').select('user_id').eq('status', 'verified'),
      ])
      if (usersRes.error) throw usersRes.error
      if (paymentsRes.error) throw paymentsRes.error

      const verifiedUserIds = new Set((paymentsRes.data || []).map((payment) => payment.user_id))
      eligibleUserIds = (usersRes.data || [])
        .map((user) => user.id)
        .filter((userId) => verifiedUserIds.has(userId))
      if (eligibleUserIds.length === 0) searchUserIds = []
    }

    if (searchUserIds?.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          page,
          limit: PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        },
      })
    }

    const buildListQuery = () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, name, gender, date_of_birth, city, state, profile_status, payment_required, completion_percent, updated_at, users ( name, email, is_active, created_at )')
      if (filters.status) query = query.eq('profile_status', filters.status)
      if (filters.gender) query = query.eq('gender', filters.gender)
      if (searchUserIds) query = query.in('user_id', searchUserIds)
      if (eligibleUserIds) {
        query = query
          .eq('profile_status', 'approved')
          .eq('payment_required', false)
          .in('user_id', eligibleUserIds)
      }
      // pending last touched first — the admin works top-down
      return query.order('updated_at', { ascending: false })
    }

    // rows for this page
    const { data: rows, error } = await buildListQuery()
      .range((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT - 1)
    if (error) throw error

    // total (same filters, count only)
    const { count: total, error: countError } = await buildListQuery()
      .select('id', { count: 'exact', head: true })
    if (countError) throw countError

    // main photo and payment per item (one extra query for the whole page)
    const userIds = rows.map((r) => r.user_id)
    let photosByUser = {}
    let paymentsByUser = {}
    if (userIds.length > 0) {
      const [photoRes, paymentRes] = await Promise.all([
        supabase
          .from('profile_photos')
          .select('user_id, url, is_main')
          .in('user_id', userIds)
          .eq('is_main', true),
        supabase
          .from('membership_payments')
          .select('user_id, status, amount, utr_number, submitted_at, reviewed_at')
          .in('user_id', userIds),
      ])
      if (photoRes.error) throw photoRes.error
      if (paymentRes.error) throw paymentRes.error
      photosByUser = Object.fromEntries((photoRes.data || []).map((p) => [p.user_id, p.url]))
      paymentsByUser = Object.fromEntries((paymentRes.data || []).map((p) => [p.user_id, p]))
    }

    const items = rows.map((r) => {
      const dob = r.date_of_birth ? new Date(r.date_of_birth) : null
      const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null
      const paymentInfo = paymentsByUser[r.user_id] || null
      return {
        userId: r.user_id,
        name: r.name || r.users?.name,
        accountEmail: r.users?.email,
        accountName: r.users?.name,
        isActive: r.users?.is_active ?? true,
        registeredAt: r.users?.created_at,
        gender: r.gender,
        age,
        city: r.city,
        state: r.state,
        status: r.profile_status,
        paymentRequired: r.payment_required ?? false,
        paymentStatus: paymentInfo?.status ?? null,
        paymentAmount: paymentInfo?.amount ?? null,
        completionPercent: r.completion_percent,
        submittedAt: r.updated_at,
        profilePhotoUrl: photosByUser[r.user_id] ?? null,
      }
    })

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

// ------------------------------------------------------------------
// GET /api/admin/profiles/:id — FULL profile for one user
// (:id = userId; includes contact details, photos, kundli, etc.)
// ------------------------------------------------------------------
export async function getFullProfile(req, res, next) {
  try {
    const userId = req.params.id
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
      throw new AppError('Invalid user id.', 400)
    }

    const snapshot = await loadProfileSnapshot(userId, { createIfMissing: false })

    // account details for the admin view
    const [userRes, paymentRes] = await Promise.all([
      supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('id', userId)
      .maybeSingle(),
      supabase.from('membership_payments').select('*').eq('user_id', userId).maybeSingle(),
    ])
    if (userRes.error) throw userRes.error
    if (paymentRes.error) throw paymentRes.error
    const user = userRes.data
    if (!user) throw new AppError('User not found.', 404)

    res.json({
      success: true,
      data: {
        profile: snapshot,
        account: user,
        payment: paymentRes.data,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/assignments/:userId — current exclusive assigned match
// ---------------------------------------------------------------------------
export async function getProfileAssignment(req, res, next) {
  try {
    const userId = req.params.userId
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
      throw new AppError('Invalid user id.', 400)
    }

    const { data: assignment, error } = await supabase
      .from('profile_assignments')
      .select('bride_user_id, groom_user_id')
      .or(`bride_user_id.eq.${userId},groom_user_id.eq.${userId}`)
      .maybeSingle()
    if (error) throw error

    const partnerId = assignment
      ? assignment.bride_user_id === userId ? assignment.groom_user_id : assignment.bride_user_id
      : null
    const summaries = partnerId ? await userSummaries([partnerId]) : {}

    res.json({
      success: true,
      data: { assignedProfile: partnerId ? summaries[partnerId] ?? null : null },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/assignments — replace assignments for both selected users
// ---------------------------------------------------------------------------
export async function assignProfilePair(req, res, next) {
  try {
    const brideUserId = req.body?.brideUserId
    const groomUserId = req.body?.groomUserId
    if (
      typeof brideUserId !== 'string' ||
      typeof groomUserId !== 'string' ||
      !/^[0-9a-fA-F-]{36}$/.test(brideUserId) ||
      !/^[0-9a-fA-F-]{36}$/.test(groomUserId)
    ) {
      throw new AppError('Choose a valid bride and groom profile.', 400)
    }
    if (brideUserId === groomUserId) {
      throw new AppError('Choose two different profiles.', 400)
    }

    const { error } = await supabase.rpc('assign_profile_pair', {
      p_bride_user_id: brideUserId,
      p_groom_user_id: groomUserId,
      p_assigned_by: req.user.id,
    })
    if (error) {
      if (error.message?.includes('Choose one bride profile and one groom profile')) {
        throw new AppError('Choose one bride profile and one groom profile.', 400)
      }
      if (error.message?.includes('approved profiles with verified payments')) {
        throw new AppError('Both profiles must be approved and have verified payments before they can be assigned.', 409)
      }
      if (error.message?.includes('Only an admin can assign profiles')) {
        throw new AppError('Only an admin can assign profiles.', 403)
      }
      throw error
    }

    res.json({ success: true, message: 'Profiles assigned successfully.' })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/admin/profiles/:id/approve
// ------------------------------------------------------------------
export async function approveProfile(req, res, next) {
  try {
    const userId = req.params.id
    const profile = await getProfileRowOr404(userId)

    if (profile.profile_status === 'approved') {
      return res.json({ success: true, message: 'Profile is already approved.', data: { status: 'approved' } })
    }
    if (profile.profile_status === 'draft') {
      throw new AppError('This profile has not been submitted yet (still a draft).', 400)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ profile_status: 'approved', rejection_reason: null, payment_required: true })
      .eq('user_id', userId)
    if (error) throw error

    await createNotification(
      userId,
      'Profile approved',
      'Your profile is approved. The admin will send a payment request. A match can be assigned after payment verification.'
    )

    res.json({
      success: true,
      message: 'Profile approved. Send a payment request to the member.',
      data: { status: 'approved' },
    })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/admin/profiles/:id/reject — reason required
// ------------------------------------------------------------------
export async function rejectProfile(req, res, next) {
  try {
    const userId = req.params.id
    const reason = String(req.body?.reason ?? '').trim()

    if (reason.length < 5) {
      throw new AppError('Please give a reason (at least 5 characters) so the user knows what to fix.', 400)
    }
    if (reason.length > 500) {
      throw new AppError('Reason must be at most 500 characters.', 400)
    }
    const profile = await getProfileRowOr404(userId)
    if (profile.profile_status !== 'pending_approval') {
      throw new AppError('Only profiles that are under review can be rejected.', 400)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ profile_status: 'rejected', rejection_reason: reason })
      .eq('user_id', userId)
    if (error) throw error

    await createNotification(
      userId,
      'Profile needs changes',
      `Your profile was not approved. Reason: ${reason} You can edit your profile and resubmit.`
    )

    res.json({ success: true, message: 'Profile rejected.', data: { status: 'rejected', reason } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// PATCH /api/admin/users/:id/active — activate / deactivate
// (deactivated users cannot log in; admin cannot deactivate admins,
//  including themselves)
// ------------------------------------------------------------------
export async function setUserActive(req, res, next) {
  try {
    const targetId = req.params.id
    const isActive = req.body?.isActive

    if (typeof isActive !== 'boolean') {
      throw new AppError('Send isActive: true or false.', 400)
    }

    const { data: target, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', targetId)
      .maybeSingle()
    if (error) throw error
    if (!target) throw new AppError('User not found.', 404)

    if (target.role === 'admin') {
      throw new AppError('Admin accounts cannot be deactivated.', 400)
    }
    if (!isActive && target.id === req.user.id) {
      throw new AppError('You cannot deactivate yourself.', 400)
    }
    if (isActive === target.is_active) {
      return res.json({
        success: true,
        message: `Account is already ${isActive ? 'active' : 'deactivated'}.`,
        data: { userId: target.id, isActive },
      })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', targetId)
    if (updateError) throw updateError

    res.json({
      success: true,
      message: isActive ? 'Account activated.' : 'Account deactivated.',
      data: { userId: targetId, isActive },
    })
  } catch (err) {
    next(err)
  }
}

async function getProfileRowOr404(userId) {
  if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
    throw new AppError('Invalid user id.', 400)
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, profile_status')
    .eq('user_id', userId)
    .maybeSingle()
  if (!profile) throw new AppError('Profile not found for this user.', 404)
  return profile
}

// ===========================================================================
// Stage 5 — contact messages from the public Contact Us form
// ===========================================================================

export {
  listContactMessages,
  setContactMessageHandled,
  replyToContactMessage,
} from './contactController.js'

const ageFromDob = (dob) => {
  if (!dob) return null
  return Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)))
}

/**
 * Compact per-user summary used for the current assigned match.
 * Returns { [userId]: summary }.
 */
async function userSummaries(userIds) {
  const uniq = [...new Set(userIds)].filter(Boolean)
  if (uniq.length === 0) return {}

  const [profileRes, photoRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, id, name, gender, date_of_birth, city, state, profile_status, users ( email, is_active )')
      .in('user_id', uniq),
    supabase
      .from('profile_photos')
      .select('user_id, url')
      .in('user_id', uniq)
      .eq('is_main', true),
  ])
  if (profileRes.error) throw profileRes.error
  if (photoRes.error) throw photoRes.error

  const photos = Object.fromEntries((photoRes.data || []).map((p) => [p.user_id, p.url]))
  const map = {}
  for (const row of profileRes.data || []) {
    map[row.user_id] = {
      userId: row.user_id,
      profileId: row.id,
      name: row.name,
      gender: row.gender,
      age: ageFromDob(row.date_of_birth),
      city: row.city,
      state: row.state,
      status: row.profile_status,
      email: row.users?.email ?? null,
      isActive: row.users?.is_active ?? true,
      profilePhotoUrl: photos[row.user_id] ?? null,
    }
  }
  return map
}
