import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  sendOtp,
  verifyOtpHandler,
  register,
  login,
  me,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
} from '../controllers/authController.js'
import { authRequired } from '../middleware/authMiddleware.js'

const router = Router()

// Rate-limit brute-force attempts on register + login.
// 10 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
})

// OTP rate-limiter — 5 OTP requests per 15 minutes per IP.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
})

// Registration OTP
router.post('/send-otp', otpLimiter, sendOtp)
router.post('/verify-otp', authLimiter, verifyOtpHandler)
router.post('/register', authLimiter, register)

// Login
router.post('/login', authLimiter, login)
router.get('/me', authRequired, me)

// Forgot / Reset password
router.post('/forgot-password', otpLimiter, forgotPassword)
router.post('/verify-forgot-otp', authLimiter, verifyForgotOtp)
router.post('/reset-password', authLimiter, resetPassword)

export default router
