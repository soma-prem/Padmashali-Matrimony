export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8
export const MIN_NAME_LENGTH = 2

/**
 * Throws an AppError(400) with a readable message when validation fails.
 */
export function assertValidRegistration({ name, email, password }) {
  if (!name || typeof name !== 'string' || name.trim().length < MIN_NAME_LENGTH) {
    throwValidation('Name must be at least 2 characters.')
  }
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throwValidation('Please provide a valid email address.')
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throwValidation(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
}

export function assertValidLogin({ email, password }) {
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throwValidation('Please provide a valid email address.')
  }
  if (!password) {
    throwValidation('Password is required.')
  }
}

function throwValidation(message) {
  const error = new Error(message)
  error.isValidation = true
  error.statusCode = 400
  throw error
}
