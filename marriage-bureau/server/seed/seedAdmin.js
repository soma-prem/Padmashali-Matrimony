import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

import { supabase } from '../config/supabase.js'

/**
 * Creates the admin account from ADMIN_EMAIL + ADMIN_PASSWORD in .env.
 * Skips silently if the admin already exists.
 * Run with: npm run seed:admin
 */
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''

  if (!email || !password) {
    console.error('✗ ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('✗ ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  // does the admin already exist?
  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle()

  if (fetchError) {
    console.error(`✗ Could not check database: ${fetchError.message}`)
    console.error('  (Is schema.sql already run in Supabase, and SUPABASE_URL / key set correctly?)')
    process.exit(1)
  }

  if (existing) {
    console.log(`• Admin already exists (${existing.email}). Nothing to do.`)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('users')
    .insert({ name: 'Admin', email, password_hash: passwordHash, role: 'admin' })
    .select('id, email, role')
    .single()

  if (error) {
    console.error(`✗ Failed to create admin: ${error.message}`)
    process.exit(1)
  }

  console.log(`✓ Admin created: ${data.email} (id: ${data.id})`)
  process.exit(0)
}

seedAdmin()
