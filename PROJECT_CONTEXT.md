# PROJECT_CONTEXT.md — Padmashali Samaj Matrimony

Community matrimony website for the Padmashali samaj, with members from other
communities welcome.

## Tech stack (do not change)
- **Frontend:** Vite + React (JavaScript), plain CSS, react-router-dom
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL), accessed only by the backend service-role client
- **Image storage:** Cloudinary
- **Auth:** JWT + bcrypt; roles are `user` and `admin`
- **Folders:** `/client` and `/server`

## Business flow
1. A user registers, completes their profile and submits it for admin approval.
2. The admin approves or rejects the profile with a reason.
3. After approval, the admin sends payment instructions. The user submits payment details,
   and the admin verifies the payment.
4. The admin manually assigns an active, approved, paid bride/groom pair.
5. Each member sees only their admin-assigned match, including that match's contact details.

Members do not browse the profile directory, send interest requests or create connections.

## Rules
- **Profile status:** `draft -> pending_approval -> approved / rejected`.
  Rejected users can edit and resubmit their profile.
- **Assignment eligibility:** both accounts must be active users; both profiles must be
  approved and have verified payment (`payment_required = false`). Enforce this in the
  admin candidate API and the `assign_profile_pair` database function.
- **Assignments:** exclusive bride/groom pairs. Reassigning either member replaces their
  previous pair.
- **Assigned matches:** list and detail APIs expose only the current assigned partner.
  Detail responses may include contact details only after the backend verifies the
  assignment and both members remain eligible.
- **Notifications:** in-website notifications cover profile approval/rejection, payment
  requests and verification, and admin assignments.
- **Legacy data:** Stage 7 deliberately drops `interest_requests` and `connections`.
  Do not execute migrations against a live database without explicit authorization.

## Explicitly not included
Kundli matching scores, gotra warnings, shortlist/favourites, report/block, language
toggle, success stories, paid plans, charts or ID verification badges.

## Profile fields
- **Basic:** name, gender, date of birth, height, weight, marital status, mother tongue, about me
- **Community:** caste, sub-caste/kulam, gotra
- **Horoscope:** time/place of birth, rashi, nakshatra, pada, graha details, manglik, kundli image
- **Education/career:** qualification, college, field, occupation, company, annual income
- **Family:** parent details, siblings, family type/values, native place
- **Lifestyle/location:** diet, smoking, drinking, hobbies, city, state, country, relocation
- **Photos:** one profile photo and up to five additional photos
- **Private contact:** mobile, WhatsApp, email and address

## Design
Traditional but modern; sky blue (`#0284c7`, `#075985`, `#38bdf8`) and white
(`#f8fbff`, `#ffffff`) palette, mobile-first layouts, Playfair Display headings and
Poppins body text.

## Migration history
- **Stages 1–3:** project setup, auth, profile creation, admin profile approval and notifications.
- **Stage 4 (legacy):** browse, interest requests and connections; superseded by admin-assigned
  matchmaking and removed from the application.
- **Stage 5:** public pages, contact messages, navigation, accessibility and demo seed data.
- **Stage 6:** exclusive admin-assigned bride/groom pairs.
- **Stage 7:** drops legacy request/connection tables and requires approved, active,
  payment-verified profiles for assignments.
