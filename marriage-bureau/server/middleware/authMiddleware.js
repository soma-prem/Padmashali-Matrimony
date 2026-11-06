import { verifyToken } from '../utils/jwt.js'

/**
 * Verifies the "Authorization: Bearer <token>" header and attaches req.user.
 * Returns 401 when the token is missing/invalid/expired.
 */
export function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      const error = new Error('Please log in to continue.')
      error.statusCode = 401
      throw error
    }

    const decoded = verifyToken(token)
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch (err) {
    next(err) // JWT errors are mapped by the central error handler
  }
}

/**
 * Must run AFTER authRequired. Restricts to role = "user".
 * Admin accounts do not have a matrimonial profile.
 */
export function userOnly(req, res, next) {
  if (!req.user || req.user.role !== 'user') {
    const error = new Error('Only user accounts have a matrimonial profile.')
    error.statusCode = 403
    throw error
  }
  next()
}

/**
 * Must run AFTER authRequired. Restricts to role = "admin".
 */
export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    const error = new Error('You do not have permission to do that.')
    error.statusCode = 403
    throw error
  }
  next()
}
