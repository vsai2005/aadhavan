# Deploy Playbook — Aadhavan Production

Total time: **~90 minutes**, most of it waiting for DNS to propagate.
Total cost: **~$5/mo Railway + ~₹800/yr domain ≈ ₹1,200/month all-in**.

---

## What's already done (by the code changes)

- ✅ `debug=True` removed; production/dev auto-switch via `FLASK_ENV`
- ✅ `SECRET_KEY` required & enforced in production (fails fast if missing)
- ✅ Session cookies hardened (`Secure`, `HttpOnly`, `SameSite=Lax`)
- ✅ `ProxyFix` middleware added (correct `client_ip()` behind Railway's proxy)
- ✅ `/health` endpoint for load-balancer liveness probes
- ✅ Real notifications wired: `notifications.py` sends Resend email on every inquiry, with a `wa.me` reply-on-WhatsApp button + tap-to-call button
- ✅ Gunicorn + config file + `Procfile` + `railway.json` added
- ✅ `requirements.txt` updated (gunicorn, requests)

---

## What YOU need to do (4 accounts, 1 domain, ~90 min)

### Step 1 — Buy a domain (~₹800/yr, 5 min)

Go to **Namecheap** or **Cloudflare Registrar** (Cloudflare is cheaper,
no upsells). Search for:

- `aadhavanevents.in` (recommended — `.in` is cheap, clearly Indian)
- `aadhavandecors.com`
- Or whatever matches her Instagram handle

Buy it. Don't pay for "WhoisGuard" upsells on Namecheap — it's free on
Cloudflare.

### Step 2 — Set up Resend for email (10 min + DNS wait)

1. Sign up at **resend.com** (free, no credit card).
2. **Domains → Add Domain** → enter your domain (`aadhavanevents.in`).
3. Resend shows you 3 DNS records to add (SPF, DKIM, MX-like). Copy them.
4. Go to your registrar's DNS panel and paste each record in.
5. Click **Verify** in Resend. Takes 5 min to 2 hours for DNS to propagate.
6. Once verified, go to **API Keys → Create API Key**. Copy it — you'll
   paste it into Railway in Step 4. It starts with `re_…`.

### Step 3 — Push code to GitHub (5 min)

```bash
cd aadhavan
git init
git add .
git commit -m "Production-ready: Gunicorn, Resend notifications, session hardening"

# Create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/aadhavan.git
git branch -M main
git push -u origin main
```

**Critical:** make sure `.env` is in `.gitignore`. Never commit real secrets.
Create a `.gitignore` if it doesn't exist with at least:
```
.env
data/
uploads/
__pycache__/
*.pyc
```

### Step 4 — Deploy to Railway (15 min)

1. Sign up at **railway.com** (free to sign up, $5/mo when you deploy).
2. **New Project → Deploy from GitHub repo → pick aadhavan**.
3. Railway detects Python, reads `Procfile` and `railway.json` automatically.
   First deploy will build but the app will crash on startup — that's
   expected, it needs env vars. Continue to step 5.

### Step 5 — Add a persistent volume (5 min) — **DO NOT SKIP**

Without this, every deploy wipes the SQLite database and all uploaded photos.

1. In your Railway service → **Settings → Volumes → Add Volume**.
2. Mount path: `/app/data`
3. Size: **1 GB** is plenty to start.
4. Add a second volume:
   - Mount path: `/app/uploads`
   - Size: **2 GB**

### Step 6 — Set environment variables (10 min)

In your Railway service → **Variables tab**, add every key below:

| Variable | Value |
|---|---|
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | Run `python -c "import secrets; print(secrets.token_hex(32))"` locally, paste output |
| `DATABASE_URL` | `sqlite:////app/data/aadhavan.db` *(yes, 4 slashes — absolute path)* |
| `PUBLIC_SITE_URL` | `https://aadhavanevents.in` (your domain from Step 1) |
| `RESEND_API_KEY` | Paste the `re_…` key from Step 2 |
| `RESEND_FROM_EMAIL` | `notifications@aadhavanevents.in` |
| `OWNER_NOTIFICATION_EMAIL` | Your sister's actual email |
| `SEED_ADMIN_EMAIL` | Admin login email (pick a real one) |
| `SEED_ADMIN_PASSWORD` | Long random password — you'll use this to log in to `/admin/` |

After saving, Railway redeploys automatically. Wait ~90 seconds for it to
come up. Check the **Deploy Logs** tab for errors.

### Step 7 — Seed the database (one time, 2 min)

1. In your Railway service, click the **three-dots menu → Run Command**.
2. Run: `python seed.py`
3. You should see: `✔ Created owner account: …` and `✔ Default settings seeded`.

If you don't have a Run Command feature, install the Railway CLI and run:
```bash
railway run python seed.py
```

### Step 8 — Connect your domain (15 min + DNS wait)

1. Railway service → **Settings → Networking → Custom Domain → Add**.
2. Enter `aadhavanevents.in` and `www.aadhavanevents.in`.
3. Railway gives you a CNAME target (e.g. `aadhavan.up.railway.app`).
4. At your domain registrar:
   - `@` (root) → CNAME or ALIAS → `aadhavan.up.railway.app`
   - `www` → CNAME → `aadhavan.up.railway.app`
5. Wait 10–60 min for DNS + Railway's auto-HTTPS cert to issue. You'll
   see a green checkmark in Railway when ready.

### Step 9 — Smoke test (5 min)

Visit `https://aadhavanevents.in`. Check:
- [ ] Homepage loads over HTTPS (green padlock)
- [ ] `/health` returns `{"ok": true}`
- [ ] Submit a test inquiry with your phone number + email
- [ ] Your sister's inbox gets the email within 30s
- [ ] Click the "Reply on WhatsApp" button — opens WhatsApp chat to the
      test number with greeting pre-filled ✓
- [ ] Log in at `/admin/` with the seed credentials
- [ ] **Change the admin password immediately** via Settings

### Step 10 — Lock down the admin (2 min)

In `/admin/` → Settings → Change Password. Use a long, unique password.
Store it in a password manager (Bitwarden / 1Password), not a sticky note.

---

## Post-launch (the stuff that actually brings customers)

These are NOT code tasks — they're what moves her business forward:

1. **Google Business Profile** (free, huge impact for local search). Go to
   `business.google.com`, claim "Aadhavan Event Design", add service area
   (Hyderabad / wherever), real photos, phone, hours, website URL.
2. **Real photos in the admin panel**. Upload 15–25 high-quality photos
   of actual past events via `/admin/` → Gallery. No stock images ever.
3. **Instagram ↔ website link**. Put the website URL in her Instagram bio,
   and link the Instagram profile from the website (already in settings).
4. **Ask 3 past clients for a testimonial** with their name + event type.
   Add them to the homepage.
5. **Local WhatsApp groups** — share the site in neighborhood / community
   groups in her service area.

---

## Cost summary

| Item | Cost |
|---|---|
| Domain (`.in`, yearly) | ~₹800 / ~$10 |
| Railway (Hobby plan) | $5/mo (~₹420) |
| Resend email | Free (up to 3000/mo) |
| Google Business Profile | Free |
| **Total monthly** | **~₹450 ($5.50)** |

---

## When to upgrade

Upgrade away from this stack **only if** one of these happens:

- More than ~50 inquiries/day sustained (SQLite becomes a bottleneck → move to Postgres on Railway, same platform, 1-click)
- Need multi-region (sister expands to multiple cities → Fly.io)
- Need a team editing content (add Cloudflare in front for caching)

Until then, don't overthink it. This setup handles hundreds of daily
visitors and dozens of inquiries comfortably.
