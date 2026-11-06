import { Router } from 'express'
import { authRequired, userOnly } from '../middleware/authMiddleware.js'
import {
  sendRequest,
  listSentRequests,
  cancelRequest,
} from '../controllers/requestController.js'

/**
 * Interest requests — mounted at /api/requests in server.js.
 */
const router = Router()

router.use(authRequired, userOnly)

router.post('/', sendRequest)
router.get('/sent', listSentRequests)
router.delete('/:id', cancelRequest)

export default router
