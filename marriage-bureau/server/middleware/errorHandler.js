/**
 * 404 for unknown API routes.
 */
export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

/**
 * Central error handling middleware.
 * Every thrown error ends up here — config errors are logged, client-facing
 * errors (AppError / validation) are returned cleanly.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = 500
  let message = 'Something went wrong. Please try again.'

  if (err) {
    // our own AppError / validation errors
    if (err.statusCode) {
      statusCode = err.statusCode
      message = err.message
    }
    // Postgres unique violation (e.g. email already registered)
    else if (err.code === '23505') {
      statusCode = 409
      message = 'This email is already registered.'
    }
    // Postgres check constraint violation (bad values caught by the DB too)
    else if (err.code === '23514') {
      statusCode = 400
      message = 'Some values are not allowed — please check the form and try again.'
    }
    // Postgres foreign key violation
    else if (err.code === '23503') {
      statusCode = 400
      message = 'Related record not found.'
    }
    // Supabase REST errors
    else if (err.name === 'AuthApiError' || err.details || err.code) {
      statusCode = 400
      message = err.message || message
    }
    // multer upload errors
    else if (err.name === 'MulterError') {
      statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Maximum size is 5 MB.'
          : err.message || 'Upload failed.'
    }
    // JWT errors
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401
      message = 'Session expired. Please log in again.'
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = 401
      message = 'Invalid session. Please log in again.'
    }
  }

  if (statusCode >= 500) {
    // log server-side; never leak internals to the client
    console.error('Error:', err)
  }

  res.status(statusCode).json({ success: false, message })
}
