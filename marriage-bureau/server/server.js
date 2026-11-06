import 'dotenv/config' // must be the FIRST import so all other modules see the env vars
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import browseRoutes from './routes/browseRoutes.js'
import requestRoutes from './routes/requestRoutes.js'
import connectionRoutes from './routes/connectionRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

// --- global middleware ---
app.use(helmet())
app.use(
  cors({
    // Allowed origins: every URL listed in CLIENT_URL (comma-separated).
    // In development we additionally allow the local Vite dev server on any
    // 517x port, so "Port 5173 is in use, trying another one..." never breaks CORS.
    origin: (origin, callback) => {
      const allowed = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
        : ['http://localhost:5173']

      const isDevLocal =
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/localhost:(517[0-9]|518[0-9]|519[0-9])$/.test(origin || '')

      if (!origin || allowed.includes(origin) || isDevLocal) {
        callback(null, true)
      } else {
        callback(new Error(`Origin not allowed by CORS: ${origin}`))
      }
    },
  })
)
app.use(express.json({ limit: '1mb' }))

// --- simple welcome route (the actual API lives under /api/...) ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Padmashali Samaj Matrimony API is running',
    docs: {
      health: 'GET /api/health',
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
    },
  })
})

// --- health check ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy', time: new Date().toISOString() })
})

// --- routes ---
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/browse', browseRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/connections', connectionRoutes)
app.use('/api/contact', contactRoutes)

// --- 404 + central error handler ---
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
