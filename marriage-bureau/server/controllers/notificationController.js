import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

// ------------------------------------------------------------------
// GET /api/notifications — latest 50 for the logged-in user
// ------------------------------------------------------------------
export async function listNotifications(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error

    res.json({
      success: true,
      data: {
        items: data.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          createdAt: n.created_at,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// GET /api/notifications/unread-count
// ------------------------------------------------------------------
export async function unreadCount(req, res, next) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false)
    if (error) throw error

    res.json({ success: true, data: { unread: count ?? 0 } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/notifications/:id/read — only own notifications
// ------------------------------------------------------------------
export async function markRead(req, res, next) {
  try {
    const { id } = req.params
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      throw new AppError('Invalid notification id.', 400)
    }

    // ownership enforced by the WHERE user_id — someone else's id is "not found"
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) {
      throw new AppError('Notification not found.', 404)
    }

    res.json({ success: true, message: 'Marked as read.' })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/notifications/read-all
// ------------------------------------------------------------------
export async function markAllRead(req, res, next) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false)
    if (error) throw error

    res.json({ success: true, message: 'All notifications marked as read.' })
  } catch (err) {
    next(err)
  }
}
