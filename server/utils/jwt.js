import jwt from 'jsonwebtoken'

const JWT_EXPIRY = '7d' // tokens are valid for 7 days

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}
