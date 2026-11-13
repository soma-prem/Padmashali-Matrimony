import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/authMiddleware.js'
import {
  getStats,
  listProfiles,
  getFullProfile,
  approveProfile,
  rejectProfile,
  setUserActive,
  getProfileAssignment,
  assignProfilePair,
  listContactMessages,
  setContactMessageHandled,
  replyToContactMessage,
} from '../controllers/adminController.js'
import upload from '../middleware/uploadMiddleware.js'
import {
  sendPaymentRequest,
  listPaymentSubmissions,
  verifyPayment,
  rejectPayment,
} from '../controllers/paymentController.js'

const router = Router()

router.use(authRequired, adminOnly)

router.get('/stats', getStats)
router.get('/profiles', listProfiles)
router.get('/profiles/:id', getFullProfile)
router.get('/assignments/:userId', getProfileAssignment)
router.post('/assignments', assignProfilePair)
router.post('/profiles/:id/approve', approveProfile)
router.post('/profiles/:id/reject', rejectProfile)
router.post('/profiles/:id/payment-request', upload.single('image'), sendPaymentRequest)
router.get('/payments', listPaymentSubmissions)
router.post('/payments/:id/verify', verifyPayment)
router.post('/payments/:id/reject', rejectPayment)
router.patch('/users/:id/active', setUserActive)

// Stage 5 — contact messages from the public Contact Us form
router.get('/messages', listContactMessages)
router.patch('/messages/:id/handled', setContactMessageHandled)
router.post('/messages/:id/reply', replyToContactMessage)

export default router
