import { supabase } from '../config/supabase.js'

/**
 * In-website notification. NEVER email/SMS/WhatsApp.
 * Throws on failure so admin actions surface an error and can retry.
 */
export async function createNotification(userId, title, message) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message })
  if (error) throw error
}
