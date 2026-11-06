import cloudinary from '../config/cloudinary.js'
import { AppError } from './AppError.js'

const IMAGE_ROOT_FOLDER = 'marriage-bureau'

/**
 * Uploads a multer file (memory buffer) to Cloudinary.
 * Returns { url, publicId } or throws a 502-style AppError on failure.
 */
export async function uploadImage(file, folder) {
  try {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${IMAGE_ROOT_FOLDER}/${folder}`,
      resource_type: 'image',
    })
    return { url: result.secure_url, publicId: result.public_id }
  } catch (err) {
    console.error('Cloudinary upload failed:', err)
    throw new AppError('Image upload failed. Please try again.', 502)
  }
}

/**
 * Best-effort delete from Cloudinary (never throws — deletion of an
 * orphaned asset must not stop the API response).
 */
export async function deleteImage(publicId) {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  } catch (err) {
    console.error(`Cloudinary delete failed for ${publicId}:`, err)
  }
}
