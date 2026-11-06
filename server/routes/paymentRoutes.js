import { Router } from 'express'
import { authRequired, userOnly } from '../middleware/authMiddleware.js'
import upload from '../middleware/uploadMiddleware.js'
import { getMyPayment, submitPayment } from '../controllers/paymentController.js'

const router = Router()

router.use(authRequired, userOnly)
router.get('/me', getMyPayment)
router.post('/submit', upload.single('image'), submitPayment)

export default router
