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
      pendingRequests,
      pendingPayments,
      totalConnections,
      uniqueVisitors,
    ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('profile_status', 'pending_approval'),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('profile_status', 'approved'),
        supabase.from('interest_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('membership_payments').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('connections').select('id', { count: 'exact', head: true }),
        supabase.from('site_visitors').select('visitor_id', { count: 'exact', head: true }),
      ])

    for (const r of [usersTotal, totalProfiles, pendingProfiles, approvedProfiles, pendingRequests, pendingPayments, totalConnections, uniqueVisitors]) {
      if (r.error) throw r.error
    }

    res.json({
      success: true,
      data: {
        totalUsers: usersTotal.count ?? 0,
        totalProfiles: totalProfiles.count ?? 0,
        pendingProfiles: pendingProfiles.count ?? 0,
        approvedProfiles: approvedProfiles.count ?? 0,
        pendingRequests: pendingRequests.count ?? 0,   // always 0 until Stage 4
        pendingPayments: pendingPayments.count ?? 0,
        totalConnections: totalConnections.count ?? 0, // always 0 until Stage 4
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

    const filters = {}
    if (status && ADMIN_STATUSES.includes(status)) filters.status = status
    if (gender && ADMIN_GENDERS.includes(gender)) filters.gender = gender

    const q = String(search || '').trim().slice(0, 80)
    const searchSafe = q.replace(/,/g, ' ').replace(/[%()]/g, '')

    const buildListQuery = () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, name, gender, date_of_birth, city, state, profile_status, payment_required, completion_percent, updated_at, users ( name, email, is_active, created_at )')
      if (filters.status) query = query.eq('profile_status', filters.status)
      if (filters.gender) query = query.eq('gender', filters.gender)
      if (searchSafe) {
        query = query.or(
          `name.ilike.%${searchSafe}%,users.name.ilike.%${searchSafe}%,users.email.ilike.%${searchSafe}%`
        )
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
      'Your profile is approved. The admin will send a payment request. Browsing unlocks after payment verification.'
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

// ===========================================================================
// Stage 4 — interest requests & connections
// ===========================================================================

const ageFromDob = (dob) => {
  if (!dob) return null
  return Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)))
}

/**
 * Compact per-USER summary used in the admin request/connection lists
 * (name, age, city, photo, email). Returns { [userId]: summary }.
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

// ---------------------------------------------------------------------------
// GET /api/admin/requests?status=pending|approved|rejected|all
// ---------------------------------------------------------------------------
export async function listRequests(req, res, next) {
  try {
    const status = ['pending', 'approved', 'rejected', 'all'].includes(req.query.status)
      ? req.query.status
      : 'pending'
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)

    let query = supabase
      .from('interest_requests')
      .select('id, sender_id, receiver_id, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
    if (status !== 'all') query = query.eq('status', status)

    const { data: requests, error, count } = await query
      .range((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT - 1)
    if (error) throw error

    const summaries = await userSummaries(requests.flatMap((r) => [r.sender_id, r.receiver_id]))

    const items = requests
      .map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        sender: summaries[r.sender_id] ?? null,
        receiver: summaries[r.receiver_id] ?? null,
      }))
      .filter((r) => r.sender && r.receiver)

    res.json({
      success: true,
      data: {
        items,
        filter: status,
        page,
        limit: PAGE_LIMIT,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_LIMIT)),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/requests/:id — BOTH full profiles (contact included), side by side
// ---------------------------------------------------------------------------
export async function getRequestDetail(req, res, next) {
  try {
    const id = req.params.id
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new AppError('Invalid request id.', 400)

    const { data: request, error } = await supabase
      .from('interest_requests')
      .select('id, sender_id, receiver_id, status, created_at')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!request) throw new AppError('Request not found.', 404)

    const [senderSnapshot, receiverSnapshot, senderAccount, receiverAccount] = await Promise.all([
      loadProfileSnapshot(request.sender_id, { createIfMissing: false }).catch(() => null),
      loadProfileSnapshot(request.receiver_id, { createIfMissing: false }).catch(() => null),
      supabase.from('users').select('id, name, email, role, is_active, created_at').eq('id', request.sender_id).maybeSingle(),
      supabase.from('users').select('id, name, email, role, is_active, created_at').eq('id', request.receiver_id).maybeSingle(),
    ])
    if (senderAccount.error) throw senderAccount.error
    if (receiverAccount.error) throw receiverAccount.error

    res.json({
      success: true,
      data: {
        request: { id: request.id, status: request.status, createdAt: request.created_at },
        sender: { profile: senderSnapshot, account: senderAccount.data },
        receiver: { profile: receiverSnapshot, account: receiverAccount.data },
      },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/requests/:id/approve — creates the connection + notifies BOTH
// ---------------------------------------------------------------------------
export async function approveRequest(req, res, next) {
  try {
    const id = req.params.id
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new AppError('Invalid request id.', 400)

    const { data: request, error } = await supabase
      .from('interest_requests')
      .select('id, sender_id, receiver_id, status')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!request) throw new AppError('Request not found.', 404)
    if (request.status !== 'pending') {
      throw new AppError(`This request was already ${request.status}.`, 400)
    }

    // create the connection (sorted pair, unique) if not already there
    const [a, b] = request.sender_id < request.receiver_id
      ? [request.sender_id, request.receiver_id]
      : [request.receiver_id, request.sender_id]

    const { data: existingConn } = await supabase
      .from('connections')
      .select('id')
      .eq('user_a_id', a)
      .eq('user_b_id', b)
      .maybeSingle()
    if (!existingConn) {
      const { error: connError } = await supabase
        .from('connections')
        .insert({ user_a_id: a, user_b_id: b })
      if (connError) throw connError
    }

    // transition pending -> approved (guards a double-click)
    const { data: moved, error: updateError } = await supabase
      .from('interest_requests')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
    if (updateError) throw updateError
    if (!moved || moved.length === 0) {
      throw new AppError('This request was already processed.', 400)
    }

    // names for the notifications
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', [request.sender_id, request.receiver_id])
    if (usersError) throw usersError
    const nameOf = (uid) => users.find((u) => u.id === uid)?.name ?? 'the other member'
    const otherName = (uid) => nameOf(uid === request.sender_id ? request.receiver_id : request.sender_id)

    await Promise.all([
      createNotification(
        request.sender_id,
        'Request approved',
        `Your request was approved. You are now connected with ${otherName(request.sender_id)}. You can view their contact details in My Connections.`
      ),
      createNotification(
        request.receiver_id,
        'You have a new connection',
        `Your request was approved. You are now connected with ${otherName(request.receiver_id)}. You can view their contact details in My Connections.`
      ),
    ])

    res.json({ success: true, message: 'Request approved. Both users are now connected.', data: { status: 'approved' } })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/requests/:id/reject — optional reason, notifies the SENDER
// ---------------------------------------------------------------------------
export async function rejectRequest(req, res, next) {
  try {
    const id = req.params.id
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new AppError('Invalid request id.', 400)
    const reason = String(req.body?.reason ?? '').trim().slice(0, 500)

    const { data: request, error } = await supabase
      .from('interest_requests')
      .select('id, sender_id, receiver_id, status')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!request) throw new AppError('Request not found.', 404)
    if (request.status !== 'pending') {
      throw new AppError(`This request was already ${request.status}.`, 400)
    }

    const { error: updateError } = await supabase
      .from('interest_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
      .eq('status', 'pending')
    if (updateError) throw updateError

    // sender's name for the message
    const { data: sender } = await supabase
      .from('users').select('name').eq('id', request.sender_id).maybeSingle()

    await createNotification(
      request.sender_id,
      'Request not approved',
      `Your interest request was not approved by the admin.${reason ? ` Reason: ${reason}` : ''}`
    )

    res.json({
      success: true,
      message: `Request rejected. ${sender?.name ?? 'The sender'} has been notified.`,
      data: { status: 'rejected', reason },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/connections — all connections with both summaries
// ---------------------------------------------------------------------------
export async function listConnections(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const { data: connections, error, count } = await supabase
      .from('connections')
      .select('id, user_a_id, user_b_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT - 1)
    if (error) throw error

    const summaries = await userSummaries(
      connections.flatMap((c) => [c.user_a_id, c.user_b_id])
    )

    const items = connections.map((c) => ({
      id: c.id,
      createdAt: c.created_at,
      userA: summaries[c.user_a_id] ?? null,
      userB: summaries[c.user_b_id] ?? null,
    }))

    res.json({
      success: true,
      data: {
        items,
        page,
        limit: PAGE_LIMIT,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_LIMIT)),
      },
    })
  } catch (err) {
    next(err)
  }
}
