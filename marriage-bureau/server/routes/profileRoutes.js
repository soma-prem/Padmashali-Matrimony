import { Router } from 'express'
import upload from '../middleware/uploadMiddleware.js'
import { authRequired, userOnly } from '../middleware/authMiddleware.js'
import {
  getMyProfile,
  getCommunityOptions,
  updateMyProfile,
  submitProfile,
  addPhoto,
  deletePhoto,
  setPrimaryPhoto,
  uploadKundli,
} from '../controllers/profileController.js'

/**
 * Profile API — mounted at /api/profile in server.js.
 * All routes require a logged-in user (role "user").
 */
const router = Router()

router.use(authRequired, userOnly)

// profile data + section saves
router.get('/me', getMyProfile)
router.get('/community-options', getCommunityOptions)
router.put('/me', updateMyProfile)
router.post('/submit', submitProfile)

// photos (multipart field name: "image")
router.post('/photos', upload.single('image'), addPhoto)
router.delete('/photos/:id', deletePhoto)
router.put('/photos/:id/primary', setPrimaryPhoto)

// kundli image (multipart field name: "image")
router.post('/kundli', upload.single('image'), uploadKundli)

export default router
