import { Router } from 'express'
import { authRequired, userOnly } from '../middleware/authMiddleware.js'
import { listBrowse, getBrowseDetail } from '../controllers/browseController.js'

/**
 * Browse API — mounted at /api/browse in server.js.
 * Only approved (user role) accounts may call it; the controller also
 * checks the caller's PROFILE is approved (403 otherwise).
 */
const router = Router()

router.use(authRequired, userOnly)

router.get('/', listBrowse)
router.get('/:profileId', getBrowseDetail)

export default router
