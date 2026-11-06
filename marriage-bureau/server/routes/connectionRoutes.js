import { Router } from 'express'
import { authRequired, userOnly } from '../middleware/authMiddleware.js'
import { listMyConnections } from '../controllers/requestController.js'

/**
 * My connections (with contact details) — mounted at /api/connections.
 */
const router = Router()

router.use(authRequired, userOnly)

router.get('/', listMyConnections)

export default router
