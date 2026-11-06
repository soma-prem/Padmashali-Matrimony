import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Multer in memory storage: the file is kept in req.file.buffer
 * (nothing touches disk) and pushed straight to Cloudinary.
 * Field name expected in multipart/form-data: "image".
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },

  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        Object.assign(
          new Error('Only JPG, PNG or WEBP images are allowed.'),
          { statusCode: 400 }
        )
      )
    }
  },
})

export default upload
export { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE }
