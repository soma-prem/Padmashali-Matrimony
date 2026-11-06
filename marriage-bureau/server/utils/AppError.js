/**
 * Operational error with an HTTP status code — safe to send to the client.
 * Used instead of throwing raw errors that could leak internals.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
  }
}
