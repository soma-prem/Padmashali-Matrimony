import { supabase } from '../config/supabase.js'
import { AppError } from './AppError.js'

/**
 * Relationship status helpers between the logged-in user and one or many
 * other users. Used by browse, detail, requests and connections APIs.
 *
 * Statuses: 'none' | 'request_pending' | 'request_rejected' | 'connected'
 */

const sortPair = (a, b) => (a < b ? [a, b] : [b, a])

/**
 * statuses for MANY others at once (one page of browse results).
 * Returns { [otherUserId]: status }
 */
export async function getRelationshipMap(myId, otherIds) {
  const map = Object.fromEntries(otherIds.map((id) => [id, 'none']))
  if (otherIds.length === 0) return map

  const list = otherIds.join(',')
  const [reqRes, connRes] = await Promise.all([
    supabase
      .from('interest_requests')
      .select('sender_id, receiver_id, status')
      .or(
        `and(sender_id.eq.${myId},receiver_id.in.(${list})),` +
        `and(receiver_id.eq.${myId},sender_id.in.(${list}))`
      ),
    supabase
      .from('connections')
      .select('user_a_id, user_b_id')
      .or(
        `and(user_a_id.eq.${myId},user_b_id.in.(${list})),` +
        `and(user_b_id.eq.${myId},user_a_id.in.(${list}))`
      ),
  ])
  if (reqRes.error) throw reqRes.error
  if (connRes.error) throw connRes.error

  for (const c of connRes.data || []) {
    const other = c.user_a_id === myId ? c.user_b_id : c.user_a_id
    map[other] = 'connected'
  }
  // requests only matter for people not already connected
  for (const r of reqRes.data || []) {
    const other = r.sender_id === myId ? r.receiver_id : r.sender_id
    if (map[other] === 'connected') continue
    if (r.status === 'pending') map[other] = 'request_pending'
    else if (r.status === 'rejected') map[other] = 'request_rejected'
  }
  return map
}

/** single-pair variant (detail page, request guards) */
export async function getRelationship(myId, otherId) {
  const map = await getRelationshipMap(myId, [otherId])
  return map[otherId]
}

/** true when a connections row exists for the pair */
export async function checkConnected(a, b) {
  const [x, y] = sortPair(a, b)
  const { data, error } = await supabase
    .from('connections')
    .select('id')
    .eq('user_a_id', x)
    .eq('user_b_id', y)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

/**
 * Fetches the viewer's own profile status row.
 * Throws 403 unless the profile exists AND is approved.
 */
export async function requireApprovedProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, profile_status, gender, payment_required')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!profile || profile.profile_status !== 'approved') {
    throw new AppError('Your profile must be approved before you can browse.', 403)
  }
  if (profile.payment_required) {
    throw new AppError('Your membership payment must be verified before you can browse.', 403)
  }
  return profile
}

/** removes the private contact block from a snapshot (defence in depth) */
export function stripContact(snapshot) {
  if (!snapshot) return snapshot
  const copy = { ...snapshot }
  delete copy.contact
  return copy
}

/**
 * Is `otherProfile` a valid target for the viewer?
 * (exists, approved, opposite gender, not self)
 * Returns the profile row or throws.
 */
export function assertBrowseTarget(otherProfile, viewerProfile) {
  if (!otherProfile) throw new AppError('Profile not found.', 404)
  if (otherProfile.profile_status !== 'approved') {
    throw new AppError('This profile is not available.', 404)
  }
  if (otherProfile.payment_required) {
    throw new AppError('This profile is not available.', 404)
  }
  if (viewerProfile && otherProfile.user_id === viewerProfile.user_id) {
    throw new AppError('This is your own profile.', 400)
  }
  if (
    viewerProfile?.gender &&
    otherProfile.gender &&
    otherProfile.gender === viewerProfile.gender
  ) {
    throw new AppError('You can only view profiles of the opposite gender.', 403)
  }
  return otherProfile
}
