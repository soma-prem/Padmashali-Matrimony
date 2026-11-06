import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

const clean = (value, max) => {
  const t = String(value ?? '').trim().slice(0, max)
  return t || null
}

/**
 * POST /api/contact — public form (no login required).
 * Stored in contact_messages; reviewed by the admin in the admin area.
 */
export async function sendContactMessage(req, res, next) {
  try {
    const body = req.body || {}

    const name = clean(body.name, 80)
    const email = clean(body.email, 120).toLowerCase().replace(/[%(,)]/g, '')
    const phone = clean(body.phone, 20)
    const subject = clean(body.subject, 120)
    const message = clean(body.message, 1000)

    if (!name || name.length < 2) throw new AppError('Please enter your name.', 400)
    // simple, backslash-free email shape check
    const at = email.indexOf('@')
    const emailOk =
      at > 0 && email.indexOf('.', at) > at + 1 && !email.includes(' ')
    if (!email || !emailOk) {
      throw new AppError('Please enter a valid email address.', 400)
    }
    // phone: digits/+/spaces/dashes only (no regex escapes needed)
    if (phone && !/^[0-9+()\- ]{6,20}$/.test(phone)) {
      throw new AppError('Phone number is not valid.', 400)
    }
    if (!message || message.length < 10) {
      throw new AppError('Please write a message of at least 10 characters.', 400)
    }

    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, phone, subject, message })
    if (error) throw error

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. The admin team will get back to you soon.',
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Admin — GET /api/admin/messages?filter=handled|open|all
// ---------------------------------------------------------------------------
export async function listContactMessages(req, res, next) {
  try {
    const filter = ['open', 'handled', 'all'].includes(req.query.filter)
      ? req.query.filter
      : 'open'

    let query = supabase
      .from('contact_messages')
      .select('id, name, email, phone, subject, message, is_handled, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (filter === 'open') query = query.eq('is_handled', false)
    if (filter === 'handled') query = query.eq('is_handled', true)

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data: { items: data, filter } })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/messages/:id/handled  body: { isHandled: true|false }
export async function setContactMessageHandled(req, res, next) {
  try {
    const isHandled = req.body?.isHandled
    if (typeof isHandled !== 'boolean') {
      throw new AppError('Send isHandled: true or false.', 400)
    }
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ is_handled: isHandled })
      .eq('id', req.params.id)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) throw new AppError('Message not found.', 404)

    res.json({ success: true, message: isHandled ? 'Marked as handled.' : 'Marked as open.' })
  } catch (err) {
    next(err)
  }
}
