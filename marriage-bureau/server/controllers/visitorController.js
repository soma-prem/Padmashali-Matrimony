import { supabase } from '../config/supabase.js'

const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function recordVisitor(req, res, next) {
  try {
    const visitorId = req.body?.visitorId
    if (typeof visitorId !== 'string' || !VISITOR_ID_PATTERN.test(visitorId)) {
      return res.status(400).json({ success: false, message: 'A valid visitor ID is required.' })
    }

    const { error } = await supabase
      .from('site_visitors')
      .upsert({ visitor_id: visitorId }, { onConflict: 'visitor_id', ignoreDuplicates: true })
    if (error) throw error

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
