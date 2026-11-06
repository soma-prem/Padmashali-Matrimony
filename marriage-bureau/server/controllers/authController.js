import bcrypt from 'bcrypt'
import { supabase } from '../config/supabase.js'
import { signToken } from '../utils/jwt.js'
import { AppError } from '../utils/AppError.js'
import { assertValidRegistration, assertValidLogin } from '../utils/validators.js'

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
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const body = req.body || {}
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const { password } = body

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
