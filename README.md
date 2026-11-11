# Padmashali Samaj Matrimony 💙

A community matrimony website (like Shaadi.com) built mainly for the **Padmashali samaj**
(other communities welcome), with an **admin-assisted matchmaking** process:

1. User registers → fills profile → submits for approval
2. Admin verifies (approves / rejects with a reason)
3. Approved users browse profiles of the **opposite gender only — without contact details**
4. User sends an **interest request** (max 5 pending at a time)
5. Admin reviews and approves → **both members become connected**
6. Only then do both sides see **contact details**, plus in-website notifications

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React (JavaScript), plain CSS, react-router-dom |
| Backend | Node.js + Express (ESM) |
| Database | Supabase (PostgreSQL) via service-role key — **frontend never touches Supabase** |
| Images | Cloudinary (photos + kundli) |
| Auth | Own JWT (7 days) + bcrypt. Roles: `user`, `admin` |

Design: **sky blue (#0284c7 / #075985) + white (#f8fbff)**, Playfair Display headings,
Poppins body, mobile-first.

## Folder structure

```
marriage-bureau/
├── client/                     # Vite + React frontend
│   ├── index.html              # Google Fonts + meta description
│   └── src/
│       ├── api/api.js          # fetch helpers (JWT, 401 auto-logout, toasts)
│       ├── components/         # Navbar (hamburger), Footer, NotificationBell, Toaster…
│       ├── components/profileSteps/   # 10-step profile wizard
│       ├── pages/              # Home, AboutSamaj, HowItWorks, ContactUs, TermsPrivacy,
│       │                       # Register, Login, Profile, Notifications, UserDashboard,
│       │                       # Browse, BrowseDetail, MyRequests, MyConnections, NotFound
│       ├── pages/admin/        # AdminLayout, Dashboard, Profiles, ProfileDetail,
│       │                       # Requests, Connections, ContactMessages
│       └── styles/             # one plain-CSS file per area
└── server/                     # Express backend
    ├── server.js               # app entry — mounts all routes
    ├── config/                 # supabase + cloudinary + env
    ├── controllers/            # auth / profile / admin / browse / requests / notifications / contact
    ├── middleware/             # authRequired/userOnly/adminOnly, multer upload, error handler
    ├── seed/                   # seedAdmin.js (creates admin), seedDemo.js (⚠ demo data)
    └── db/                     # schema.sql + migrations_stage2.sql + migrations_stage5.sql
```

---

# Setup guide (beginner friendly)

## 1. Install Node.js

Install **Node.js 18 or newer** from <https://nodejs.org> ("LTS" version is fine).
Then open a terminal and check: `node -v` and `npm -v` both print a version.

## 2. Create the Supabase database (free)

1. Register at <https://supabase.com> → **New project** (choose a region near you).
2. Open **SQL Editor → New query**, paste the entire contents of
   **`server/db/schema.sql`** and press **Run**. This creates every table.
3. Run the two small migrations the same way (each is safe to re-run; re-run
   `migrations_stage5.sql` on existing databases to add email reply history):
   - `server/db/migrations_stage2.sql` (adds Cloudinary `public_id` columns)
   - `server/db/migrations_stage5.sql` (adds the contact messages and email reply history tables)
4. Get your keys: **Project Settings → API**. You need:
   - `Project URL` → this is `SUPABASE_URL`
   - `service_role` key (in the secret box) → this is `SUPABASE_SERVICE_ROLE_KEY`
   - (the anon key is NOT used by this project)

## 3. Create a Cloudinary account (free)

1. Register at <https://console.cloudinary.com>.
2. On the dashboard home copy the **Cloud name**; under **Settings → Access Keys**
   copy **API key** and **API secret**.

## 4. Backend setup

```bash
cd server
npm install
```

Create `server/.env` (copy `.env.example` if it exists, or paste this):

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173
JWT_SECRET=change-this-to-a-long-random-string

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM="Padmashali Matrimony <your-email@gmail.com>"

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisAdminPass1

# seed:demo test password is Demo@1234 — do not use it for real accounts
```

### Create the admin account

```bash
npm run seed:admin
```

(Uses the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values you just set. The admin logs in at
`http://<site>/login` and is taken to the `/admin` panel.)

### Give yourself a matrimonial profile later?

Not needed — admins don't need one. Add real users by registering normally in the UI.

## 5. Frontend setup

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

(For local development you can also skip this file — Vite's dev server proxies `/api`
to `http://localhost:5000`.)

## 6. Run everything — two terminals

```bash
# terminal 1
cd server && npm run dev     # → http://localhost:5000

# terminal 2
cd client && npm run dev     # → http://localhost:5173
```

Register a normal user at `/register`, complete the 10-step profile, submit, then approve
yourself in the admin panel.

## 7. Demo data (testing only)

```bash
cd server
npm run seed:demo
```

Creates 4 approved demo users (2 grooms, 2 brides) with obviously fake sample data and
fake payment submissions awaiting admin review. Verify a demo payment in the admin panel
to unlock that profile for browsing. Emails are all `*@demo.example`, every password is
`Demo@1234`. Re-running replaces them.
**See the "Before going live" checklist below — delete these before launch.**

---

## Security features

- Passwords stored as bcrypt hashes, never returned by any API (`toPublicUser` whitelist)
- JWT auth (7-day expiry) with `authRequired` + role guards (`adminOnly` / `userOnly`)
- Rate limiting: 10 attempts/15 min on login+register, 5 messages/15 min on the contact form
- Contact details (mobile/WhatsApp/email/address) are stripped server-side in **every**
  browse/list/detail response — only the admin and members with an approved connection receive them
- File uploads limited to JPG/PNG/WEBP, max 5 MB, max 6 photos, ownership checks on every photo/kundli route
- CORS restricted to `CLIENT_URL` (+ local dev ports), helmet enabled, JSON body limit 1 MB
- Central error handler: clean `{ success: false, message }` responses, **no stack traces**; client auto-logs-out on 401 (expired token)

---

## Deployment guide

### Frontend — Vercel (or Netlify)

1. Push the project to **GitHub**.
2. Vercel → **New Project** → import the repo → **Root directory: `client`**
   (framework preset: Vite).
3. Environment variables for the frontend:
   - `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`
4. Deploy. Any SPA needs a rewrite for client-side routes: for **Netlify** add
   `client/public/_redirects` containing `/*  /index.html  200`
   (Vercel rewrites SPA routes automatically).

### Backend — Render (or Railway)

1. Render → **New Web Service** → connect the repo, **Root directory: `server`**.
2. Build command: `npm install` · Start command: `npm start`
   (Railway: same start command; it detects the port automatically.)
3. Add the **same environment variables** as in `server/.env`, but production values:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend.vercel.app` ← **this must be your real frontend URL**
   - `VITE_API_URL` does NOT belong to the backend — it stays on Vercel.
4. Set the same `JWT_SECRET` everywhere you deploy (backend), and never reuse a dev secret.
5. After deploy, run `npm run seed:admin` once (Render → Shell) to create the admin.
6. Do NOT run `npm run seed:demo` on production unless you delete it afterwards.

**Update sequence when URLs change:** set `CLIENT_URL` on the backend (CORS) and
`VITE_API_URL` on the frontend (API base), then redeploy both.

---

## Before going live — checklist

- [ ] **Replace the JWT secret** (`JWT_SECRET`) with a long random string — changing it also
      invalidates all old tokens
- [ ] **Change the admin password** (`ADMIN_PASSWORD` → re-create or change it in the DB) —
      never keep a default/demo password
- [ ] **Delete demo data**: `npm run seed:demo` users (all `*@demo.example`) must be removed —
      delete those four users in the Supabase Table Editor (cascades to their profiles) or
      run `DELETE FROM users WHERE email LIKE '%@demo.example';` in SQL Editor
- [ ] Set production env values (`CLIENT_URL`, `VITE_API_URL`, `SUPABASE_*`,
      `CLOUDINARY_*`, `NODE_ENV=production`)
- [ ] Test on a real phone (register → fill → submit → approve → browse → request → connect)
- [ ] Enable **Supabase backups**: paid projects have point-in-time restore — otherwise use
      Supabase's built-in Table Editor backups or a scheduled `pg_dump`
- [ ] Turn on Supabase project pause protection (free projects pause after inactivity!)
- [ ] Review the admin panel: approved profiles, open requests, contact messages
- [ ] Toast check: verify all flows on a fresh browser session

Let's go! 💙
