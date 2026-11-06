import { Router } from 'express'
import { authRequired } from '../middleware/authMiddleware.js'
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from '../controllers/notificationController.js'

const router = Router()

router.use(authRequired)
router.get('/', listNotifications)
router.get('/unread-count', unreadCount)
router.post('/read-all', markAllRead)
router.post('/:id/read', markRead)

export default router
