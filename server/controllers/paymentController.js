import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { uploadImage, deleteImage } from '../utils/cloudinaryImage.js'
import { createNotification } from '../utils/notifications.js'

const UTR_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/-]{5,49}$/

function paymentView(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    qrImageUrl: row.qr_image_url,
    status: row.status,
    requestSentAt: row.request_sent_at,
    utrNumber: row.utr_number,
    paymentScreenshotUrl: row.payment_screenshot_url,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason,
  }
}

function validId(id) {
  return /^[0-9a-fA-F-]{36}$/.test(id)
}

// GET /api/payment/me
export async function getMyPayment(req, res, next) {
  try {
    const { data: payment, error } = await supabase
      .from('membership_payments')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()
    if (error) throw error

    res.json({ success: true, data: { payment: paymentView(payment) } })
  } catch (err) {
    next(err)
  }
}

// POST /api/payment/submit (multipart: image, utrNumber)
export async function submitPayment(req, res, next) {
  try {
    const userId = req.user.id
    const utrNumber = String(req.body?.utrNumber ?? '').trim()
    if (!UTR_PATTERN.test(utrNumber)) {
      throw new AppError('Enter a valid UTR number (6–50 letters, numbers, / or -).', 400)
    }
    if (!req.file) throw new AppError('Attach your payment screenshot.', 400)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_status, payment_required')
      .eq('user_id', userId)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile || profile.profile_status !== 'approved' || !profile.payment_required) {
      throw new AppError('There is no active membership payment request for your account.', 409)
    }

    const { data: request, error: requestError } = await supabase
      .from('membership_payments')
      .select('id, status, payment_screenshot_public_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (requestError) throw requestError
    if (!request || !['requested', 'rejected'].includes(request.status)) {
      throw new AppError('Your payment request is not ready for submission.', 409)
    }

    const { url, publicId } = await uploadImage(req.file, `membership-payments/${userId}/proof`)
    const { data: updated, error: updateError } = await supabase
      .from('membership_payments')
      .update({
        utr_number: utrNumber,
        payment_screenshot_url: url,
        payment_screenshot_public_id: publicId,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        status: 'submitted',
      })
      .eq('id', request.id)
      .in('status', ['requested', 'rejected'])
      .select('*')
      .maybeSingle()
    if (updateError) {
      await deleteImage(publicId)
      throw updateError
    }
    if (!updated) {
      await deleteImage(publicId)
      throw new AppError('The payment request changed. Refresh the page and try again.', 409)
    }

    if (request.payment_screenshot_public_id) {
      await deleteImage(request.payment_screenshot_public_id)
    }

    res.json({
      success: true,
      message: 'Payment details sent to the admin for verification.',
      data: { payment: paymentView(updated) },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/profiles/:id/payment-request (multipart: image, amount)
export async function sendPaymentRequest(req, res, next) {
  try {
    const userId = req.params.id
    if (!validId(userId)) throw new AppError('Invalid user id.', 400)

    const amountText = String(req.body?.amount ?? '').trim()
    const amount = Number(amountText)
    if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount)
      || amount <= 0 || amount > 9999999999.99) {
      throw new AppError('Enter a valid amount with up to two decimal places.', 400)
    }
    if (!req.file) throw new AppError('Attach the payment QR/scanner image.', 400)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_status, payment_required')
      .eq('user_id', userId)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile || profile.profile_status !== 'approved' || !profile.payment_required) {
      throw new AppError('Approve the profile before sending a payment request.', 409)
    }

    const { data: existing, error: existingError } = await supabase
      .from('membership_payments')
      .select('id, status, qr_public_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing && existing.status !== 'requested') {
      throw new AppError('A payment request already exists. The member must submit or resubmit payment details.', 409)
    }

    const { url, publicId } = await uploadImage(req.file, `membership-payments/${userId}/qr`)
    const values = {
      user_id: userId,
      amount,
      qr_image_url: url,
      qr_public_id: publicId,
      status: 'requested',
      request_sent_at: new Date().toISOString(),
      utr_number: null,
      payment_screenshot_url: null,
      payment_screenshot_public_id: null,
      submitted_at: null,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
    }
    const query = existing
      ? supabase.from('membership_payments').update(values).eq('id', existing.id).eq('status', 'requested')
      : supabase.from('membership_payments').insert(values)
    const { data: saved, error: saveError } = await query.select('*').maybeSingle()
    if (saveError) {
      await deleteImage(publicId)
      throw saveError
    }
    if (!saved) {
      await deleteImage(publicId)
      throw new AppError('The payment request changed. Refresh the page and try again.', 409)
    }

    if (existing?.qr_public_id) await deleteImage(existing.qr_public_id)
    await createNotification(
      userId,
      'Membership payment requested',
      'The admin sent your payment amount and QR code. Open Payment details to pay and submit your UTR number and screenshot.'
    )

    res.status(201).json({
      success: true,
      message: 'Payment request sent to the member.',
      data: { payment: paymentView(saved) },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/payments
export async function listPaymentSubmissions(req, res, next) {
  try {
    const status = req.query.status === 'verified' ? 'verified' : 'submitted'
    const search = String(req.query.search || '').trim().slice(0, 80).replace(/[,%()]/g, '')
    const dateValue = (value) => {
      if (!value) return null
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new AppError('Dates must use YYYY-MM-DD format.', 400)
      }
      const date = new Date(`${value}T00:00:00.000Z`)
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new AppError('Enter a valid date.', 400)
      }
      return value
    }
    const fromDate = dateValue(req.query.from)
    const toDate = dateValue(req.query.to)
    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError('The start date must be on or before the end date.', 400)
    }

    let matchingUserIds = null
    if (search) {
      const pattern = `%${search}%`
      const [userNameRes, userEmailRes, profilesRes, paymentSearchRes] = await Promise.all([
        supabase.from('users').select('id').ilike('name', pattern),
        supabase.from('users').select('id').ilike('email', pattern),
        supabase.from('profiles').select('user_id').ilike('name', pattern),
        supabase.from('membership_payments').select('user_id')
          .eq('status', status).ilike('utr_number', pattern),
      ])
      if (userNameRes.error) throw userNameRes.error
      if (userEmailRes.error) throw userEmailRes.error
      if (profilesRes.error) throw profilesRes.error
      if (paymentSearchRes.error) throw paymentSearchRes.error
      matchingUserIds = [...new Set([
        ...(userNameRes.data || []).map((user) => user.id),
        ...(userEmailRes.data || []).map((user) => user.id),
        ...(profilesRes.data || []).map((profile) => profile.user_id),
        ...(paymentSearchRes.data || []).map((payment) => payment.user_id),
      ])]
      if (matchingUserIds.length === 0) {
        return res.json({ success: true, data: { items: [], status } })
      }
    }

    const dateColumn = status === 'verified' ? 'reviewed_at' : 'submitted_at'
    let query = supabase
      .from('membership_payments')
      .select('id, user_id, amount, qr_image_url, status, request_sent_at, utr_number, payment_screenshot_url, submitted_at, reviewed_at')
      .eq('status', status)
      .order(dateColumn, { ascending: false })
    if (matchingUserIds) query = query.in('user_id', matchingUserIds)
    if (fromDate) query = query.gte(dateColumn, `${fromDate}T00:00:00.000Z`)
    if (toDate) {
      const toExclusive = new Date(`${toDate}T00:00:00.000Z`)
      toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)
      query = query.lt(dateColumn, toExclusive.toISOString())
    }
    const { data: rows, error } = await query
    if (error) throw error

    const userIds = rows.map((row) => row.user_id)
    if (userIds.length === 0) {
      return res.json({ success: true, data: { items: [] } })
    }

    const [usersRes, profilesRes] = await Promise.all([
      supabase.from('users').select('id, name, email').in('id', userIds),
      supabase.from('profiles').select('user_id, name').in('user_id', userIds),
    ])
    if (usersRes.error) throw usersRes.error
    if (profilesRes.error) throw profilesRes.error

    const users = Object.fromEntries((usersRes.data || []).map((user) => [user.id, user]))
    const profiles = Object.fromEntries((profilesRes.data || []).map((profile) => [profile.user_id, profile]))
    res.json({
      success: true,
      data: {
        items: rows.map((row) => ({
          ...paymentView(row),
          accountName: users[row.user_id]?.name,
          accountEmail: users[row.user_id]?.email,
          profileName: profiles[row.user_id]?.name,
        })),
        status,
      },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/payments/:id/verify
export async function verifyPayment(req, res, next) {
  try {
    const paymentId = req.params.id
    if (!validId(paymentId)) throw new AppError('Invalid payment id.', 400)

    const { data: payment, error: paymentError } = await supabase
      .from('membership_payments')
      .select('id, user_id, status')
      .eq('id', paymentId)
      .maybeSingle()
    if (paymentError) throw paymentError
    if (!payment || !['submitted', 'verified'].includes(payment.status)) {
      throw new AppError('Only a submitted payment can be verified.', 409)
    }

    if (payment.status === 'submitted') {
      const { data: verified, error: verifyError } = await supabase
        .from('membership_payments')
        .update({ status: 'verified', reviewed_at: new Date().toISOString(), reviewed_by: req.user.id })
        .eq('id', paymentId)
        .eq('status', 'submitted')
        .select('id')
        .maybeSingle()
      if (verifyError) throw verifyError
      if (!verified) throw new AppError('This payment was already reviewed. Refresh the page and try again.', 409)
    }

    const { data: profile, error: findProfileError } = await supabase
      .from('profiles')
      .select('payment_required')
      .eq('user_id', payment.user_id)
      .maybeSingle()
    if (findProfileError) throw findProfileError
    if (!profile) throw new AppError('Profile not found for this payment.', 404)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ payment_required: false })
      .eq('user_id', payment.user_id)
    if (profileError) throw profileError

    if (payment.status === 'submitted' || profile.payment_required) {
      await createNotification(
        payment.user_id,
        'Payment verified',
        'Your membership payment was verified. The admin can now assign profiles to you.'
      )
    }

    res.json({ success: true, message: 'Payment verified. The member is eligible for admin-assigned profiles.' })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/payments/:id/reject
export async function rejectPayment(req, res, next) {
  try {
    const paymentId = req.params.id
    if (!validId(paymentId)) throw new AppError('Invalid payment id.', 400)

    const { data: payment, error: paymentError } = await supabase
      .from('membership_payments')
      .select('id, user_id, status')
      .eq('id', paymentId)
      .maybeSingle()
    if (paymentError) throw paymentError
    if (!payment || payment.status !== 'submitted') {
      throw new AppError('Only a submitted payment can be returned for correction.', 409)
    }

    const rejectionReason = 'Payment could not be verified. Please check the UTR number and upload a clear screenshot.'
    const { data: rejected, error: updateError } = await supabase
      .from('membership_payments')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        rejection_reason: rejectionReason,
      })
      .eq('id', paymentId)
      .eq('status', 'submitted')
      .select('id')
      .maybeSingle()
    if (updateError) throw updateError
    if (!rejected) throw new AppError('This payment was already reviewed. Refresh the page and try again.', 409)

    await createNotification(
      payment.user_id,
      'Payment needs correction',
      `${rejectionReason} You can resubmit your payment details in Payment details.`
    )

    res.json({ success: true, message: 'Payment returned to the member for correction.' })
  } catch (err) {
    next(err)
  }
}
