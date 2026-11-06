import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { createNotification } from '../utils/notifications.js'
import {
  requireApprovedProfile,
  checkConnected,
} from '../utils/relations.js'
import { loadProfileSnapshot } from '../utils/profileSnapshot.js'

const MAX_PENDING_REQUESTS = 5

/**
 * Resolves a "receiverProfileId" (public.profiles.id) to the profile row
 * and validates it as a request target for the sender.
 */
async function getReceiverOrThrow(receiverProfileId, senderProfile) {
  if (!receiverProfileId || !/^[0-9a-fA-F-]{36}$/.test(String(receiverProfileId))) {
    throw new AppError('Send receiverProfileId (the id of the profile you like).', 400)
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, name, gender, profile_status, payment_required')
    .eq('id', receiverProfileId)
    .maybeSingle()
  if (error) throw error
  if (!profile) throw new AppError('That profile does not exist.', 404)
  if (profile.profile_status !== 'approved') {
    throw new AppError('That profile is not available right now.', 400)
  }
  if (profile.payment_required) {
    throw new AppError('That profile is not available right now.', 400)
  }
  if (profile.user_id === senderProfile.user_id) {
    throw new AppError('You cannot send a request to yourself.', 400)
  }
  if (senderProfile.gender && profile.gender === senderProfile.gender) {
    throw new AppError('You can only send requests to the opposite gender.', 400)
  }
  return profile
}

// ---------------------------------------------------------------------------
// POST /api/requests  { receiverProfileId }
// ---------------------------------------------------------------------------
export async function sendRequest(req, res, next) {
  try {
    const senderProfile = await requireApprovedProfile(req.user.id)
    const receiver = await getReceiverOrThrow(req.body?.receiverProfileId, senderProfile)
    const receiverId = receiver.user_id

    // already connected? (sorted pair)
    if (await checkConnected(req.user.id, receiverId)) {
      throw new AppError(`You are already connected with ${receiver.name}.`, 400)
    }

    // one request per direction — a rejected request cannot be re-sent
    const { data: existing, error: existError } = await supabase
      .from('interest_requests')
      .select('id, status')
      .eq('sender_id', req.user.id)
      .eq('receiver_id', receiverId)
      .maybeSingle()
    if (existError) throw existError
    if (existing) {
      throw new AppError(
        existing.status === 'pending'
          ? `You already have a pending request to ${receiver.name}.`
          : `Your earlier request to ${receiver.name} was ${existing.status}. Requests cannot be sent again.`,
        409
      )
    }

    // reverse-direction pending request already exists
    const { data: reverse, error: reverseError } = await supabase
      .from('interest_requests')
      .select('id, status')
      .eq('sender_id', receiverId)
      .eq('receiver_id', req.user.id)
      .maybeSingle()
    if (reverseError) throw reverseError
    if (reverse) {
      throw new AppError(
        reverse.status === 'pending'
          ? `${receiver.name} already sent you a request — wait for the admin's decision.`
          : `${receiver.name} ${reverse.status === 'approved' ? 'is' : 'was'} already ${reverse.status === 'approved' ? 'connected' : 'rejected'} with a request involving you.`,
        409
      )
    }

    // max 5 pending sent requests
    const { count: pendingCount, error: countError } = await supabase
      .from('interest_requests')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', req.user.id)
      .eq('status', 'pending')
    if (countError) throw countError
    if ((pendingCount ?? 0) >= MAX_PENDING_REQUESTS) {
      throw new AppError(
        `You already have ${MAX_PENDING_REQUESTS} pending requests. Wait for the admin to respond or cancel one before sending more.`,
        400
      )
    }

    const { data: created, error: insertError } = await supabase
      .from('interest_requests')
      .insert({ sender_id: req.user.id, receiver_id: receiverId, status: 'pending' })
      .select('id')
      .single()
    if (insertError) throw insertError

    await createNotification(
      req.user.id,
      'Request sent',
      `Your interest request was sent to ${receiver.name}. The admin will review it and both of you will be notified.`
    )

    res.status(201).json({
      success: true,
      message: `Interest request sent to ${receiver.name}. The admin will review it.`,
      data: { requestId: created.id, receiverId, status: 'pending' },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/requests/sent — my sent requests with the receiver's card data
// ---------------------------------------------------------------------------
export async function listSentRequests(req, res, next) {
  try {
    await requireApprovedProfile(req.user.id)
    const { data: requests, error } = await supabase
      .from('interest_requests')
      .select('id, receiver_id, status, created_at')
      .eq('sender_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    const receiverIds = requests.map((r) => r.receiver_id)

    const [profileRes, photoRes] = await Promise.all([
      receiverIds.length
        ? supabase
          .from('profiles')
          .select('user_id, id, name, gender, date_of_birth, city, state')
          .in('user_id', receiverIds)
        : Promise.resolve({ data: [], error: null }),
      receiverIds.length
        ? supabase.from('profile_photos').select('user_id, url').in('user_id', receiverIds).eq('is_main', true)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (profileRes.error) throw profileRes.error
    if (photoRes.error) throw photoRes.error

    const byUser = Object.fromEntries((profileRes.data || []).map((p) => [p.user_id, p]))
    const photoByUser = Object.fromEntries((photoRes.data || []).map((p) => [p.user_id, p.url]))

    const items = requests.map((r) => {
      const p = byUser[r.receiver_id]
      const age = p?.date_of_birth
        ? Math.max(0, Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000)))
        : null
      return {
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        receiver: p
          ? {
            userId: p.user_id,
            profileId: p.id,
            name: p.name,
            gender: p.gender,
            age,
            city: p.city,
            state: p.state,
            profilePhotoUrl: photoByUser[r.receiver_id] ?? null,
          }
          : null,
      }
    })

    res.json({ success: true, data: { items, pendingLimit: MAX_PENDING_REQUESTS } })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/requests/:id — cancel my own PENDING request
// ---------------------------------------------------------------------------
export async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new AppError('Invalid request id.', 400)

    const { data, error } = await supabase
      .from('interest_requests')
      .delete()
      .eq('id', id)
      .eq('sender_id', req.user.id)
      .eq('status', 'pending')
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) {
      throw new AppError('Pending request not found — only your own pending requests can be cancelled.', 404)
    }

    res.json({ success: true, message: 'Request cancelled.' })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /api/connections — my connections WITH the other person's contact details
// ---------------------------------------------------------------------------
export async function listMyConnections(req, res, next) {
  try {
    await requireApprovedProfile(req.user.id)
    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, user_a_id, user_b_id, created_at')
      .or(`user_a_id.eq.${req.user.id},user_b_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false })
    if (error) throw error

    // full snapshots (contact INCLUDED) of the people I am connected with
    const items = await Promise.all(connections.map(async (c) => {
      const otherId = c.user_a_id === req.user.id ? c.user_b_id : c.user_a_id
      const snapshot = await loadProfileSnapshot(otherId, { createIfMissing: false }).catch(() => null)
      return {
        connectionId: c.id,
        connectedAt: c.created_at,
        otherUserId: otherId,
        profileId: snapshot?.profileId ?? null,
        profile: snapshot,
      }
    }))

    res.json({
      success: true,
      data: { items: items.filter((i) => i.profile) },
    })
  } catch (err) {
    next(err)
  }
}
