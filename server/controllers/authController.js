import bcrypt from 'bcrypt'
import { supabase } from '../config/supabase.js'
import { signToken } from '../utils/jwt.js'
import { AppError } from '../utils/AppError.js'
import { assertValidRegistration, assertValidLogin } from '../utils/validators.js'
import { generateOTP, storeOTP, verifyOTP, signEmailVerifiedToken, verifyEmailVerifiedToken } from '../utils/otp.js'
import { sendOTPEmail } from '../utils/mailer.js'

const SALT_ROUNDS = 10

/**
 * Convert a users-table row into the public shape we send to the client.
 * NEVER includes password_hash.
 */
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  }
}

/**
 * POST /api/auth/send-otp
 * Body: { email }
 * Generates a 6-digit OTP and emails it.
 */
export async function sendOtp(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Please provide a valid email address.', 400)
    }

    // Check if email is already registered
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (existing) {
      throw new AppError('An account with this email already exists. Please login instead.', 409)
    }

    const otp = generateOTP()
    storeOTP(email, otp)

    await sendOTPEmail(email, otp)

    res.json({
      success: true,
      message: 'OTP sent to your email. It is valid for 5 minutes.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Returns a short-lived emailVerifiedToken on success.
 */
export async function verifyOtpHandler(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase()
    const otp = (req.body?.otp || '').trim()

    if (!email || !otp) {
      throw new AppError('Email and OTP are required.', 400)
    }

    const result = verifyOTP(email, otp)

    if (!result.valid) {
      throw new AppError(result.reason, 400)
    }

    // Issue a proof-of-verification token that the register endpoint will accept
    const emailVerifiedToken = signEmailVerifiedToken(email)

    res.json({
      success: true,
      message: 'Email verified successfully.',
      data: { emailVerifiedToken },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/register
 * Body: { name, password, emailVerifiedToken }
 * The email comes from the verified token — not from the body — so it can't be spoofed.
 */
export async function register(req, res, next) {
  try {
    const body = req.body || {}
    const name = (body.name || '').trim()
    const { password, emailVerifiedToken } = body

    // --- Verify the email-verified token ---
    if (!emailVerifiedToken) {
      throw new AppError('Email verification is required before registration.', 400)
    }

    let email
    try {
      email = verifyEmailVerifiedToken(emailVerifiedToken)
    } catch {
      throw new AppError('Email verification has expired. Please verify your email again.', 400)
    }

    assertValidRegistration({ name, email, password })

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const { data, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash: passwordHash, role: 'user' })
      .select('*')
      .single()

    if (error) throw error

    const user = toPublicUser(data)
    const token = signToken({ id: user.id, role: user.role })

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user, token },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login
 * Deactivated users (is_active = false) cannot log in.
 */
export async function login(req, res, next) {
  try {
    const body = req.body || {}
    const email = (body.email || '').trim().toLowerCase()
    const { password } = body

    assertValidLogin({ email, password })

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error

    // generic message on purpose — don't reveal which part was wrong
    const invalid = new AppError('Invalid email or password.', 401)

    if (!user) throw invalid

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatches) throw invalid

    if (!user.is_active) {
      throw new AppError('This account has been deactivated. Please contact the admin.', 403)
    }

    const token = signToken({ id: user.id, role: user.role })

    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: toPublicUser(user), token },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me — requires authRequired middleware.
 */
export async function me(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error) throw error
    if (!user || !user.is_active) {
      throw new AppError('Account not found or deactivated.', 401)
    }

    res.json({ success: true, data: { user: toPublicUser(user) } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Sends an OTP to an existing user's email for password reset.
 */
export async function forgotPassword(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Please provide a valid email address.', 400)
    }

    // Check that the email IS registered
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) throw lookupError

    if (!existing) {
      throw new AppError('No account found with this email address.', 404)
    }

    if (!existing.is_active) {
      throw new AppError('This account has been deactivated. Please contact the admin.', 403)
    }

    const otp = generateOTP()
    storeOTP(email, otp)
    await sendOTPEmail(email, otp)

    res.json({
      success: true,
      message: 'OTP sent to your email. It is valid for 5 minutes.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/verify-forgot-otp
 * Body: { email, otp }
 * Returns a short-lived password-reset token on success.
 */
export async function verifyForgotOtp(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase()
    const otp = (req.body?.otp || '').trim()

    if (!email || !otp) {
      throw new AppError('Email and OTP are required.', 400)
    }

    const result = verifyOTP(email, otp)

    if (!result.valid) {
      throw new AppError(result.reason, 400)
    }

    // Issue a password-reset token (different purpose from registration)
    const resetToken = signEmailVerifiedToken(email, 'password-reset')

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      data: { resetToken },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { resetToken, password }
 * Verifies the reset token and updates the user's password.
 */
export async function resetPassword(req, res, next) {
  try {
    const { resetToken, password } = req.body || {}

    if (!resetToken) {
      throw new AppError('Reset token is required.', 400)
    }

    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters.', 400)
    }

    let email
    try {
      email = verifyEmailVerifiedToken(resetToken, 'password-reset')
    } catch {
      throw new AppError('Reset link has expired. Please start the process again.', 400)
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email)

    if (error) throw error

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    })
  } catch (err) {
    next(err)
  }
}
