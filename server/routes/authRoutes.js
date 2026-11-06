import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, me } from '../controllers/authController.js'
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

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', authRequired, me)

export default router
