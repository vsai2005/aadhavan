# AADHAVAN — Full-Stack Demo

A single-folder, zero-config demo of the Aadhavan event-design platform. Your
original React-via-CDN prototype is now wired to a working Flask backend with
SQLite storage, session auth, and a full admin dashboard.

> ⚠ **Note on stack divergence.** Your PRD/spec targets Next.js 14 + Prisma +
> Supabase + Cloudinary + Twilio + Resend. That stack is incompatible with the
> prototype's CDN-React + Babel-standalone architecture. To keep the frontend
> you gave me *intact*, this demo trades those services for:
>
> | PRD target | Demo substitute |
> |---|---|
> | Next.js 14 App Router | Flask (serves the CDN-React pages directly) |
> | PostgreSQL + Prisma | SQLite + SQLAlchemy |
> | Cloudinary | Local `uploads/` folder + Pillow |
> | Twilio WhatsApp | Console log stub (hook point documented below) |
> | Resend email | Console log stub |
> | NextAuth JWT cookies | Flask secure-cookie sessions + bcrypt |
>
> API routes, schema, auth flow, sanitization, and rate-limit behavior all
> match the spec. This is designed to validate flows end-to-end before the
> eventual Next.js port.

---

## Quick start

```bash
# 1. Install dependencies (one time)
pip install -r requirements.txt

# 2. Seed the owner account + default settings (one time)
python seed.py

# 3. Run the server
python app.py
```

Open:
- **Public site** → http://localhost:5000
- **Admin dashboard** → http://localhost:5000/admin/

Default login (change it after first sign-in):
- Email: `owner@aadhavan.com`
- Password: `aadhavan2025`

---

## What's in the box

```
aadhavan/
├── app.py                    # Flask app + all API routes (public, admin, auth)
├── models.py                 # SQLAlchemy schema
├── seed.py                   # Creates owner user + default settings
├── requirements.txt
├── .env.example              # Copy to .env for production tweaks
├── README.md                 # You are here
│
├── data/                     # SQLite DB lives here (auto-created)
├── uploads/                  # Uploaded gallery photos (auto-created)
│
└── static/
    ├── Aadhavan.html         # Public SPA shell (unchanged from prototype)
    ├── styles.css            # 44KB site styles (unchanged)
    ├── icons.jsx             # SVG icon library (unchanged)
    ├── home.jsx              # Home page (unchanged)
    ├── shared.jsx            # Nav, Footer, Calendar — modified to hit /api/calendar
    ├── book.jsx              # Book Now — modified to POST /api/inquiries
    ├── gallery.jsx           # Gallery — modified to fetch /api/gallery (with demo fallback)
    ├── about_contact.jsx     # Contact — modified to POST /api/contact
    └── admin/
        ├── index.html        # Admin SPA shell
        ├── admin.css         # Admin styling
        └── admin.jsx         # Login + Dashboard + Inquiries + Calendar + Photos + Messages
```

---

## API surface

All routes return JSON. See `app.py` for exact shapes.

### Public (no auth)
```
GET  /api/calendar?month=N&year=N     Blocked dates for a month
GET  /api/gallery?category=X          Uploaded photos
POST /api/inquiries                   Submit a booking inquiry
POST /api/contact                     Submit a contact-form message
GET  /api/settings/public             Business phone, hours, socials
```

### Admin (session-authenticated)
```
POST   /api/auth/login                Email + password → session cookie
POST   /api/auth/logout
GET    /api/auth/session              Who am I?
PATCH  /api/auth/password             Change password

GET    /api/admin/inquiries           List (with ?status=PENDING|CONFIRMED|CLOSED)
GET    /api/admin/inquiries/:id
PATCH  /api/admin/inquiries/:id       Update status / owner notes
DELETE /api/admin/inquiries/:id

GET    /api/admin/calendar            All blocked dates with notes
POST   /api/admin/calendar/block      Block a date
PATCH  /api/admin/calendar/block/:id  Edit note
DELETE /api/admin/calendar/block/:id  Unblock

GET    /api/admin/photos
POST   /api/admin/photos/upload       Multipart file upload
PATCH  /api/admin/photos/:id
DELETE /api/admin/photos/:id

GET    /api/admin/messages
PATCH  /api/admin/messages/:id        Mark read / unread
DELETE /api/admin/messages/:id

GET    /api/admin/stats               Dashboard stats + 6-month trend
GET/PATCH /api/admin/settings
```

---

## Security behaviors (per spec)

- **bcrypt** for password hashing (12 salt rounds)
- **Rate limits** (in-memory, per IP):
  - `POST /api/inquiries` — 3/hour
  - `POST /api/contact` — 5/hour
  - `POST /api/auth/login` — 5 attempts / 15 min
- **Input sanitization** via `bleach` — strips all HTML, trims, caps at 2000 chars
- **Security headers** on every response: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- **Session cookies** are HttpOnly and signed with `SECRET_KEY`
- **File uploads** capped at 12 MB; only `.jpg/.jpeg/.png/.webp/.gif` accepted;
  images >2000px on the long edge are auto-resized via Pillow

---

## End-to-end flows (what's verified working)

1. Public visitor browses site, picks a service, clicks an open date on the
   calendar — backed by a live `GET /api/calendar?month=…` fetch that reloads
   whenever the viewed month changes.
2. They fill the inquiry modal — name, phone, requirements — and submit.
   Backend validates, rate-limits, sanitizes, saves, and logs a notification
   stub (swap in Twilio/Resend at the marked hook points).
3. Past dates and blocked dates are rejected with a friendly error. Same for
   short phone numbers, malformed emails on contact form, and fourth+
   submission within an hour.
4. Owner logs in at `/admin/`, sees dashboard stats (this-month vs last-month
   deltas, popular event types, 6-month trend).
5. Owner clicks any inquiry row → drawer opens with full details, one-click
   Call / WhatsApp buttons, status dropdown (`PENDING` → `CONFIRMED` → `CLOSED`),
   and a private notes textarea.
6. Owner blocks `2026-08-15` with a note. The public `/api/calendar` picks it
   up instantly — the next visitor's month-fetch sees that date as unavailable
   and cannot submit an inquiry for it.
7. Owner uploads a photo → Pillow reads dimensions, oversize images are
   resized, file saved to `uploads/<uuid>.ext`, metadata to DB. Public gallery
   shows it prepended to the demo placeholder set.
8. Owner marks contact messages read / unread, deletes inquiries, changes own
   password.

---

## Moving to production (the PRD's Next.js stack)

When you're ready to port:

1. **Replace Flask with Next.js 14 App Router.** The React components inside
   the JSX files are already close to Next.js-ready — they just need to become
   proper `.tsx` files with imports instead of global `window` assignments.
2. **Replace SQLAlchemy models with the Prisma schema** already written in
   your `AADHAVAN_BACKEND_SPEC.md`. Field names are intentionally aligned
   (`fullName`, `eventDate`, `serviceType` etc.) so API payloads port 1:1.
3. **Swap SQLite for Supabase Postgres.** Update `DATABASE_URL`; run
   `prisma migrate deploy`.
4. **Swap `uploads/` for Cloudinary.** The upload handler in `app.py`
   (`api_admin_upload_photo`) is the single hook point — replace the local
   file save with a `cloudinary.uploader.upload_stream` call.
5. **Swap notification stubs for Twilio + Resend.** `notify_new_inquiry()` and
   `notify_new_contact_message()` are isolated at the top of `app.py` — drop in
   the real API calls from the spec's `lib/whatsapp.ts` and `lib/email.ts`.
6. **Swap Flask sessions for NextAuth JWT.** NextAuth.js v5 credential
   provider config is already written out in the backend spec — copy it in.

---

## Known divergences from the original PRD

These are intentional simplifications for the single-folder demo — noted here
so nothing surprises you later.

- **Color palette:** follows the prototype's `v2` lilac + orange, NOT the
  PRD's ivory + rose-gold + walnut. Change the variables in `static/styles.css`
  lines 1–30 to flip back.
- **Inquiry form:** the prototype collects only name + phone + requirements.
  The PRD specifies more fields (email, guest count, venue, contact method).
  Schema supports all of them — just add the inputs to `book.jsx`.
- **Contact numbers:** Indian (`+91 80748 96611`), per the prototype, not the
  PRD's Memphis (`+1 901 555 1234`). Change via Settings page once logged in
  as admin.
- **Feedback section** on the home page uses `localStorage` (kept from the
  prototype). It's not wired to the backend; if you want persistent feedback,
  add a `POST /api/feedback` route.
- **No server-side email/WhatsApp notifications** — they log to console. The
  Thank-You screen's WhatsApp link is client-initiated (user taps it).

---

## Troubleshooting

**Port already in use:** `export PORT=5001 && python app.py`

**Forgot the admin password:** delete `data/aadhavan.db` and re-run
`python seed.py`. (Wipes all inquiries too — for a prod fix, add a password
reset script that just bcrypts a new password for the existing user.)

**Uploaded photos not showing on public gallery:** hard-refresh (Ctrl+Shift+R).
The gallery component fetches once on mount; if you uploaded a photo after
navigating to Gallery, navigate away and back.

**Changes to JSX not appearing:** the files are loaded and transpiled at
runtime by Babel-standalone — hard refresh to bypass browser cache.

---

*Built to match the behaviors documented in `AADHAVAN_PRD.docx` and
`AADHAVAN_BACKEND_SPEC.md`. Every deviation above is intentional and noted.*
