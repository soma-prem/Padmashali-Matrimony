import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/authMiddleware.js'
import {
  getStats,
  listProfiles,
  getFullProfile,
  approveProfile,
  rejectProfile,
  setUserActive,
  listRequests,
  getRequestDetail,
  approveRequest,
  rejectRequest,
  listConnections,
  listContactMessages,
  setContactMessageHandled,
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
router.post('/profiles/:id/approve', approveProfile)
router.post('/profiles/:id/reject', rejectProfile)
router.post('/profiles/:id/payment-request', upload.single('image'), sendPaymentRequest)
router.get('/payments', listPaymentSubmissions)
router.post('/payments/:id/verify', verifyPayment)
router.post('/payments/:id/reject', rejectPayment)
router.patch('/users/:id/active', setUserActive)

// Stage 4 — requests & connections
router.get('/requests', listRequests)
router.get('/requests/:id', getRequestDetail)
router.post('/requests/:id/approve', approveRequest)
router.post('/requests/:id/reject', rejectRequest)
router.get('/connections', listConnections)

// Stage 5 — contact messages from the public Contact Us form
router.get('/messages', listContactMessages)
router.patch('/messages/:id/handled', setContactMessageHandled)

export default router
