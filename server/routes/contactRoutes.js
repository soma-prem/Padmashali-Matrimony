import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { sendContactMessage } from '../controllers/contactController.js'

const router = Router()

// Prevent form-spam: 5 messages per 15 minutes per IP (public route!)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again in 15 minutes.' },
})

router.post('/', contactLimiter, sendContactMessage)

export default router
