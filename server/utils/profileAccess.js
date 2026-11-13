import { supabase } from '../config/supabase.js'
import { AppError } from './AppError.js'

/**
 * Fetches the viewer's own profile status row.
 * Throws 403 unless the profile exists AND is approved.
 */
export async function requireApprovedProfile(userId) {
  const [profileRes, userRes, paymentRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, profile_status, gender, payment_required')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('users')
      .select('id, is_active')
      .eq('id', userId)
      .eq('role', 'user')
      .maybeSingle(),
    supabase
      .from('membership_payments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'verified')
      .maybeSingle(),
  ])
  if (profileRes.error) throw profileRes.error
  if (userRes.error) throw userRes.error
  if (paymentRes.error) throw paymentRes.error
  const profile = profileRes.data
  if (!profile || profile.profile_status !== 'approved') {
    throw new AppError('Your profile must be approved before you can view assigned matches.', 403)
  }
  if (!userRes.data?.is_active) {
    throw new AppError('Your account must be active to view assigned matches.', 403)
  }
  if (profile.payment_required || !paymentRes.data) {
    throw new AppError('Your membership payment must be verified before you can view assigned matches.', 403)
  }
  return profile
}

/**
 * Is `otherProfile` a valid target for the viewer?
 * (exists, approved, opposite gender, not self)
 * Returns the profile row or throws.
 */
export function assertAssignedMatchTarget(otherProfile, viewerProfile) {
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
