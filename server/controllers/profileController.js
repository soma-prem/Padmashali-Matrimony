import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { SECTION_TARGETS, validateSection } from '../utils/profileValidation.js'
import { loadProfileSnapshot } from '../utils/profileSnapshot.js'
import { uploadImage, deleteImage } from '../utils/cloudinaryImage.js'

const MIN_SUBMIT_PERCENT = 70
const MIN_PHOTOS_TO_SUBMIT = 1
const MAX_PHOTOS = 6

const EDITABLE_STATUSES = ['draft', 'rejected']

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

/**
 * Loads + composes the logged-in user's profile snapshot.
 */
async function buildProfileSnapshot(userId) {
  return loadProfileSnapshot(userId, { createIfMissing: true })
}

/**
 * Runs all section requests in parallel-safe sequential calls.
 * Returns the updated rows.
 */
async function updateProfilesTable(userId, columns) {
  if (Object.keys(columns).length === 0) return null
  const { data, error } = await supabase
    .from('profiles')
    .update(columns)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function upsertOneToOne(table, userId, columns) {
  if (Object.keys(columns).length === 0) return null
  const { data, error } = await supabase
    .from(table)
    .upsert({ user_id: userId, ...columns }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function updateProfilesTableCreate(userId) {
  return insertEmptyProfileRow(userId)
}

async function insertEmptyProfileRow(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}



// ------------------------------------------------------------------
// GET /api/profile/me — auto-creates an empty draft if none exists
// ------------------------------------------------------------------
export async function getMyProfile(req, res, next) {
  try {
    const snapshot = await buildProfileSnapshot(req.user.id)
    res.json({ success: true, data: { profile: snapshot } })
  } catch (err) {
    next(err)
  }
}

// GET /api/profile/community-options — distinct Gotra values from approved profiles.
export async function getCommunityOptions(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('gotra')
      .eq('profile_status', 'approved')
      .not('gotra', 'is', null)
      .limit(1000)
    if (error) throw error

    const gotras = [...new Set(data.map((row) => row.gotra?.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
    res.json({ success: true, data: { gotras } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// PUT /api/profile/me — partial section saves
// Editing allowed only while status is draft or rejected.
// ------------------------------------------------------------------
export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.id
    const body = req.body || {}
    const sections = Object.keys(SECTION_TARGETS)

    const given = Object.keys(body)
    if (given.length === 0) {
      throw new AppError('Send at least one section to save (e.g. { basic: {...} }).', 400)
    }
    const unknown = given.filter((key) => !sections.includes(key))
    if (unknown.length > 0) {
      throw new AppError(`Unknown section(s): ${unknown.join(', ')}.`, 400)
    }

    // status guard (and make sure the profile row exists at all)
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('user_id, profile_status')
      .eq('user_id', userId)
      .maybeSingle()
    if (!profileRow) {
      await updateProfilesTableCreate(userId)
    }
    const status = profileRow?.profile_status ?? 'draft'
    if (!EDITABLE_STATUSES.includes(status)) {
      throw new AppError(
        status === 'pending_approval'
          ? 'Your profile is under review. Editing is not possible until the admin responds.'
          : 'Your profile is approved. Editing is not possible.',
        403
      )
    }

    // validate each provided section, then group by DB table
    const tableUpdates = { profiles: {}, horoscope_details: {}, family_details: {} }
    for (const section of given) {
      const cleaned = validateSection(section, body[section])
      const target = SECTION_TARGETS[section]
      Object.assign(tableUpdates[target], cleaned)
    }

    // apply everything (profiles update + 1:1 upserts happen sequentially — harmless)
    await updateProfilesTable(userId, tableUpdates.profiles)
    await upsertOneToOne('horoscope_details', userId, tableUpdates.horoscope_details)
    await upsertOneToOne('family_details', userId, tableUpdates.family_details)

    const snapshot = await buildProfileSnapshot(userId)
    res.json({ success: true, message: 'Saved.', data: { profile: snapshot } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/profile/photos — single image upload
// ------------------------------------------------------------------
export async function addPhoto(req, res, next) {
  try {
    const userId = req.user.id
    const file = req.file
    if (!file) throw new AppError('Attach an image in the "image" field.', 400)

    const { count: currentCount, error: countError } = await supabase
      .from('profile_photos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (countError) throw countError
    if (currentCount >= MAX_PHOTOS) {
      throw new AppError(`Maximum ${MAX_PHOTOS} photos per profile.`, 400)
    }

    const statusGuard = await ensureEditable(userId)
    if (statusGuard !== null) throw statusGuard

    // first photo becomes the profile photo
    const { count: mainCount } = await supabase
      .from('profile_photos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_main', true)

    const { url, publicId } = await uploadImage(file, `profiles/${userId}`)

    const { data: photo, error } = await supabase
      .from('profile_photos')
      .insert({
        user_id: userId,
        url,
        public_id: publicId,
        is_main: (mainCount ?? 0) === 0,
      })
      .select('*')
      .single()
    if (error) throw error

    const snapshot = await buildProfileSnapshot(userId)
    res.status(201).json({
      success: true,
      message: 'Photo uploaded.',
      data: { photo: { id: photo.id, url: photo.url, isMain: photo.is_main }, profile: snapshot },
    })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// DELETE /api/profile/photos/:id — also deletes the Cloudinary asset
// ------------------------------------------------------------------
export async function deletePhoto(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params

    const { data: photo } = await supabase
      .from('profile_photos')
      .select('id, user_id, public_id, is_main')
      .eq('id', id)
      .maybeSingle()
    if (!photo || photo.user_id !== userId) {
      // photo belongs to someone else (or does not exist) — same answer for both
      throw new AppError('Photo not found.', 404)
    }

    const statusGuard = await ensureEditable(userId)
    if (statusGuard !== null) throw statusGuard

    await supabase.from('profile_photos').delete().eq('id', id)
    await deleteImage(photo.public_id) // Cloudinary cleanup (best effort)

    // if the main photo was removed, promote the most recent remaining one
    if (photo.is_main) {
      const { data: remaining } = await supabase
        .from('profile_photos')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (remaining && remaining.length === 1) {
        await supabase.from('profile_photos').update({ is_main: true }).eq('id', remaining[0].id)
      }
    }

    const snapshot = await buildProfileSnapshot(userId)
    res.json({ success: true, message: 'Photo deleted.', data: { profile: snapshot } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// PUT /api/profile/photos/:id/primary
// ------------------------------------------------------------------
export async function setPrimaryPhoto(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params

    // ownership check
    const { data: photo } = await supabase
      .from('profile_photos')
      .select('id, user_id, is_main')
      .eq('id', id)
      .maybeSingle()
    if (!photo || photo.user_id !== userId) {
      throw new AppError('Photo not found.', 404)
    }
    if (photo.is_main) {
      const snapshot = await buildProfileSnapshot(userId)
      return res.json({ success: true, message: 'Already the profile photo.', data: { profile: snapshot } })
    }

    const statusGuard = await ensureEditable(userId)
    if (statusGuard !== null) throw statusGuard

    await supabase.from('profile_photos').update({ is_main: false }).eq('user_id', userId)
    await supabase.from('profile_photos').update({ is_main: true }).eq('id', id)

    const snapshot = await buildProfileSnapshot(userId)
    res.json({ success: true, message: 'Profile photo updated.', data: { profile: snapshot } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/profile/kundli — single kundli image (replaces old one)
// ------------------------------------------------------------------
export async function uploadKundli(req, res, next) {
  try {
    const userId = req.user.id
    const file = req.file
    if (!file) throw new AppError('Attach a kundli image in the "image" field.', 400)

    const statusGuard = await ensureEditable(userId)
    if (statusGuard !== null) throw statusGuard

    const { data: existing } = await supabase
      .from('horoscope_details')
      .select('kundli_public_id')
      .eq('user_id', userId)
      .maybeSingle()

    const { url, publicId } = await uploadImage(file, `kundlis/${userId}`)

    const { error } = await supabase
      .from('horoscope_details')
      .upsert(
        {
          // keep other horoscope fields — upsert only touches these columns
          user_id: userId,
          kundli_image_url: url,
          kundli_public_id: publicId,
        },
        { onConflict: 'user_id' }
      )
    if (error) throw error

    if (existing?.kundli_public_id) {
      await deleteImage(existing.kundli_public_id)
    }

    const snapshot = await buildProfileSnapshot(userId)
    res.status(201).json({ success: true, message: 'Kundli uploaded.', data: { profile: snapshot } })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// POST /api/profile/submit — draft/rejected -> pending_approval
// Requires: completion >= 70% and at least 1 photo.
// ------------------------------------------------------------------
export async function submitProfile(req, res, next) {
  try {
    const userId = req.user.id
    const snapshot = await buildProfileSnapshot(userId)

    if (!EDITABLE_STATUSES.includes(snapshot.status)) {
      throw new AppError('Your profile is already submitted or approved.', 400)
    }
    if (snapshot.completionPercent < MIN_SUBMIT_PERCENT) {
      throw new AppError(
        `Complete at least ${MIN_SUBMIT_PERCENT}% of your profile before submitting (currently ${snapshot.completionPercent}%).`,
        400
      )
    }
    if (snapshot.photos.length < MIN_PHOTOS_TO_SUBMIT) {
      throw new AppError('Upload at least 1 profile photo before submitting.', 400)
    }
    await updateProfilesTable(userId, {
      profile_status: 'pending_approval',
      rejection_reason: null,
    })

    const fresh = await buildProfileSnapshot(userId)
    res.json({
      success: true,
      message: 'Profile submitted for approval. You will be notified after the admin review.',
      data: { profile: fresh },
    })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------------------
// Returns an AppError if the profile is not editable, else null
// ------------------------------------------------------------------
async function ensureEditable(userId) {
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('user_id, profile_status')
    .eq('user_id', userId)
    .maybeSingle()
  const status = profileRow?.profile_status ?? 'draft'
  if (!EDITABLE_STATUSES.includes(status)) {
    return Object.assign(
      new Error(
        status === 'pending_approval'
          ? 'Your profile is under review. Photo changes are not possible until the admin responds.'
          : 'Your profile is approved. Photo changes are not possible.'
      ),
      { statusCode: 403 }
    )
  }
  return null
}
