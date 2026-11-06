import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { recordVisitor } from '../controllers/visitorController.js'

const router = Router()
const visitorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many visitor records. Please try again later.' },
})

router.post('/', visitorLimiter, recordVisitor)

export default router
