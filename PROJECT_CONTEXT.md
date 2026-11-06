# PROJECT_CONTEXT.md — Padmashali Samaj Matrimony (Community Marriage Bureau)

Community matrimony website (like Shaadi.com) mainly for the **Padmashali samaj**, but people
from other communities can also register. Built in 5 stages.

## Tech stack (DO NOT CHANGE)
- **Frontend:** Vite + React (JavaScript) + plain CSS (no Tailwind, no UI libraries) + react-router-dom
- **Backend:** Node.js + Express
- ** Database:** Supabase (PostgreSQL). Backend uses the Supabase **service role key** via `@supabase/supabase-js`. The frontend NEVER talks to Supabase directly.
- **Image storage:** Cloudinary (Stage 2)
- **Auth:** own JWT (jsonwebtoken) + bcrypt password hashing. Roles: `user` and `admin`.
- Folders: `/client` (frontend) and `/server` (backend).

## Business flow
1. User registers -> logs in -> fills profile -> submits for approval
2. Admin approves (or rejects with a reason)
3. Only approved users can browse other profiles (**opposite gender only**, WITHOUT contact details)
4. User sends an **interest request** to a profile they like
5. Admin reviews the request -> admin approves
6. Both users become **"connected"** and can see each other's contact details
7. Both get an **in-website notification**

## Rules
- **Profile status:** `draft -> pending_approval -> approved / rejected`.
  Rejected users see the reason, can edit and resubmit.
  Users whose profile is not approved cannot browse anyone.
- **Request status:** `pending -> approved / rejected`. Max **5 pending requests per user** at a time.
- **Contact details** (mobile, whatsapp, email, address) are returned by the API ONLY to the admin
  and to users who have an approved connection with that profile. NEVER in browse/list/search responses.
- **Notifications:** in-website only (no email/SMS/WhatsApp).

## Explicitly NOT included (do not build)
Kundli matching score, gotra warnings, shortlist/favourites, report/block, language toggle,
success stories page, paid plans, charts, ID verification badge.

## Profile fields (for reference)
- **Basic:** name, gender, date of birth, height, weight, marital status, mother tongue, about me
- **Community:** caste, sub-caste/kulam, gotra
- **Horoscope:** time of birth, place of birth, rashi, nakshatra, pada, graha/planet details, manglik/kuja dosham, kundli image
- **Education:** highest qualification, college, field
- **Career:** occupation, company, annual income
- **Family:** father name + occupation, mother name + occupation, brothers, sisters, family type, family values, native place
- **Lifestyle:** diet, smoking, drinking, hobbies
- **Location:** city, state, country, willing to relocate
- **Photos:** 1 profile photo + up to 5 more
- **Partner preferences:** age range, height range, education, location, marital status
- **Private contact:** mobile, whatsapp, email, address

## Design
Traditional but modern. Colours: **sky blue shades** (`#0284c7`, `#075985`, `#38bdf8`) and
**white shades** (`#f8fbff`, `#ffffff`). Mobile-first, clean cards, readable fonts.

## Stage plan
- **Stage 1 (DONE):** project setup, DB schema, auth API (register/login/me), admin seed script,
  client with router + AuthContext + protected routes, Home/Register/Login/User Dashboard/Admin Dashboard.
- **Stage 2 (DONE):** profile + photo upload (Cloudinary), profile completion, submit for approval,
  multi-step profile form (10 steps) on the client, notifications placeholder.
- **Stage 3 (DONE):** admin approvals (profiles), approve/reject with reason, in-website
  notifications (list / unread-count bell polling every 30s), user deactivate option,
  "Browse Profiles" gating on the dashboard (placeholder page until Stage 4).
- **Stage 4 (DONE):** browse/search (opposite gender, 403 unless approved, no contact
  details — contact only for connected users), interest requests (max 5 pending, cancel
  pending, no duplicates/re-requests), admin request review with side-by-side full
  profiles, approve → connection + notifications to BOTH users, reject → sender only,
  My Connections with contact details, admin Connections page, real numbers in stats.
- **Stage 5 (DONE):** public pages (Home with hero/how-it-works/why-us/community/CTA,
  About Samaj, How It Works, Contact Us saved to NEW `contact_messages` table + admin
  review page, Terms & Privacy), hamburger navbar with role-based links, new footer,
  custom 404, page titles/meta (usePageMeta + index.html), Playfair Display + Poppins
  fonts (kept sky-blue/white theme — user choice), toasts, loading spinner, focus
  accessibility, security review (rate limit on contact, 401 auto-logout client,
  no stacks; contact form), `npm run seed:demo` (4 fake approved users), README.
- **Stage 5:** connected users' contact details, notifications centre, polish (loading states,
  empty states, mobile tuning).
