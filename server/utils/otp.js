import crypto from 'crypto'
import jwt from 'jsonwebtoken'

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * In-memory OTP store.
 * Key: email (lowercase)
 * Value: { otp, expiresAt, attempts }
 *
 * In production you'd use Redis or a DB table — this is fine for dev / moderate traffic.
 */
const otpStore = new Map()

const OTP_TTL_MS = 5 * 60 * 1000   // 5 minutes
const MAX_ATTEMPTS = 5

/**
 * Save an OTP for a given email (overwrites any previous one).
 */
export function storeOTP(email, otp) {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  })
}

/**
 * Verify the OTP the user typed.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function verifyOTP(email, otp) {
  const key = email.toLowerCase()
  const entry = otpStore.get(key)

  if (!entry) {
    return { valid: false, reason: 'No OTP was requested for this email. Please request a new one.' }
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key)
    return { valid: false, reason: 'OTP has expired. Please request a new one.' }
  }

  entry.attempts += 1
  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key)
    return { valid: false, reason: 'Too many failed attempts. Please request a new OTP.' }
  }

  if (entry.otp !== otp) {
    return { valid: false, reason: 'Incorrect OTP. Please try again.' }
  }

  // OTP is correct — consume it so it can't be reused.
  otpStore.delete(key)
  return { valid: true }
}

/**
 * Sign a short-lived JWT that proves "this email was verified via OTP".
 * @param {string} email
 * @param {'email-verified'|'password-reset'} purpose
 */
export function signEmailVerifiedToken(email, purpose = 'email-verified') {
  return jwt.sign(
    { email: email.toLowerCase(), purpose },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  )
}

/**
 * Verify a purpose-specific JWT.
 * Returns the email if valid, throws otherwise.
 * @param {string} token
 * @param {'email-verified'|'password-reset'} expectedPurpose
 */
export function verifyEmailVerifiedToken(token, expectedPurpose = 'email-verified') {
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  if (decoded.purpose !== expectedPurpose) {
    throw new Error('Invalid token purpose.')
  }
  return decoded.email
}
