"""
Aadhavan — Flask backend.

Serves:
  - The React-via-CDN frontend from static/ at '/'
  - The admin SPA from static/admin/ at '/admin/'
  - All API routes under /api/* (public) and /api/admin/* (protected)
  - Uploaded photos under /uploads/*

Run: python app.py
First run will auto-create the SQLite DB. Run `python seed.py` to create
the owner account + default settings.
"""

import json
import os
import re
import secrets
import time
import uuid
from collections import defaultdict, deque
from datetime import date, datetime, timedelta
from functools import wraps
from pathlib import Path

import bcrypt
import bleach
from dotenv import load_dotenv
from flask import (
    Flask, abort, jsonify, redirect, request, send_from_directory, session,
)
from PIL import Image
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename

from notifications import notify_new_contact_message, notify_new_inquiry

from models import (
    CONTACT_METHODS, EVENT_TYPES, INQUIRY_STATUSES, PHOTO_CATEGORIES,
    BlockedDate, ContactMessage, Feedback, Inquiry, Photo, Setting, User, db,
)

load_dotenv()

# ─── App setup ───────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
STATIC_DIR = BASE_DIR / "static"
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

app = Flask(__name__, static_folder=None)  # we handle static serving ourselves

# Production posture: if FLASK_ENV=production, require a real SECRET_KEY.
# Auto-generated keys are fine for dev but log everyone out on every restart.
_is_prod = os.getenv("FLASK_ENV", "").lower() == "production"
_secret = os.getenv("SECRET_KEY")
if _is_prod and not _secret:
    raise RuntimeError(
        "SECRET_KEY environment variable must be set in production. "
        "Generate one with: python -c 'import secrets; print(secrets.token_hex(32))'"
    )
app.config["SECRET_KEY"] = _secret or secrets.token_hex(32)

_db_url = os.getenv("DATABASE_URL")
if _db_url and _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    _db_url or f"sqlite:///{DATA_DIR / 'aadhavan.db'}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024  # 12 MB upload cap
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

# Session cookie hardening (only meaningful when served over HTTPS).
if _is_prod:
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        PREFERRED_URL_SCHEME="https",
    )
    # Railway / Render / Fly all sit behind an HTTPS-terminating proxy.
    # Trust one hop of X-Forwarded-* so url_for() and client_ip() behave.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

db.init_app(app)
with app.app_context():
    db.create_all()


# ─── Security helpers ────────────────────────────────────────────────────────

_RATE_LIMITS = defaultdict(deque)  # ip -> deque[timestamps]


def rate_limit(key: str, max_hits: int, window_seconds: int) -> bool:
    """In-memory rate limiter. Returns True if allowed, False if exceeded."""
    now = time.time()
    bucket = _RATE_LIMITS[key]
    while bucket and bucket[0] < now - window_seconds:
        bucket.popleft()
    if len(bucket) >= max_hits:
        return False
    bucket.append(now)
    return True


def sanitize(text: str, max_len: int = 2000) -> str:
    """Strip all HTML, trim, and cap length (mirrors spec's DOMPurify usage)."""
    if text is None:
        return ""
    cleaned = bleach.clean(str(text), tags=[], strip=True).strip()
    return cleaned[:max_len]


def client_ip() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


# ─── Notifications: see notifications.py (real email via Resend) ────────────


# ─── Security headers on every response ─────────────────────────────────────

@app.after_request
def set_security_headers(resp):
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault(
        "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
    )
    if request.path.startswith('/api/'):
        resp.headers.setdefault("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    return resp


# ─── Static / frontend serving ──────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Liveness probe for Railway/Render/Fly/any load balancer."""
    return {"ok": True}, 200


@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "Aadhavan.html")


@app.route("/admin/")
def admin_index():
    # Unauthenticated users land on the login page which is embedded in the SPA.
    return send_from_directory(STATIC_DIR / "admin", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    # Serve anything inside static/ (CSS, JSX, admin assets)
    path = (STATIC_DIR / filename).resolve()
    if STATIC_DIR.resolve() not in path.parents and path != STATIC_DIR.resolve():
        abort(404)
    if not path.is_file():
        abort(404)
    return send_from_directory(STATIC_DIR, filename)


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOADS_DIR, filename)


# ─── Public API routes ──────────────────────────────────────────────────────

@app.route("/api/calendar")
def api_calendar():
    """Return all blocked dates in a given month (public — dates only, no notes)."""
    try:
        month = int(request.args.get("month", date.today().month))
        year = int(request.args.get("year", date.today().year))
    except ValueError:
        return jsonify({"error": "Invalid month/year"}), 400

    start = date(year, month, 1)
    end_month = month + 1 if month < 12 else 1
    end_year = year + 1 if month == 12 else year
    end = date(end_year, end_month, 1)

    rows = BlockedDate.query.filter(
        BlockedDate.date >= start, BlockedDate.date < end
    ).all()
    return jsonify({
        "month": month,
        "year": year,
        "blockedDates": [r.date.isoformat() for r in rows],
    })


@app.route("/api/gallery")
def api_gallery():
    """Return gallery photos, optionally filtered by category."""
    category = request.args.get("category")
    q = Photo.query
    if category and category.upper() != "ALL":
        q = q.filter(Photo.category == category.upper())
    photos = q.order_by(Photo.sort_order.asc(), Photo.created_at.desc()).all()
    return jsonify({"photos": [p.to_dict() for p in photos], "total": len(photos)})


@app.route("/api/inquiries", methods=["POST"])
def api_submit_inquiry():
    if not rate_limit(f"inq:{client_ip()}", max_hits=3, window_seconds=3600):
        return jsonify({"error": "Too many submissions. Please try again later."}), 429

    data = request.get_json(silent=True) or {}
    full_name = sanitize(data.get("fullName") or data.get("name"), 120)
    phone = sanitize(data.get("phone"), 32)
    email = sanitize(data.get("email"), 255) or None
    event_type = (data.get("eventType") or "OTHER").upper()
    event_date_str = data.get("eventDate")
    service_type = sanitize(data.get("serviceType"), 64) or None
    message = sanitize(data.get("message") or data.get("requirements"), 2000)
    guest_count = data.get("guestCount")
    venue = sanitize(data.get("venue"), 255) or None
    contact_method = (data.get("contactMethod") or "WHATSAPP").upper()

    # Validation
    if not full_name:
        return jsonify({"error": "Name is required", "field": "fullName"}), 400
    if not phone or len(re.sub(r"\D", "", phone)) < 10:
        return jsonify({"error": "Phone must be at least 10 digits", "field": "phone"}), 400
    if email and not EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email format", "field": "email"}), 400
    if event_type not in EVENT_TYPES:
        event_type = "OTHER"
    if contact_method not in CONTACT_METHODS:
        contact_method = "WHATSAPP"
    try:
        ev_date = date.fromisoformat(event_date_str)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid event date", "field": "eventDate"}), 400
    if ev_date < date.today():
        return jsonify({"error": "Event date cannot be in the past"}), 400

    # Blocked-date check
    if BlockedDate.query.filter_by(date=ev_date).first():
        return jsonify({"error": "This date is no longer available"}), 400

    inq = Inquiry(
        full_name=full_name,
        phone=phone,
        email=email,
        event_type=event_type,
        event_date=ev_date,
        guest_count=int(guest_count) if guest_count else None,
        venue=venue,
        contact_method=contact_method,
        service_type=service_type,
        message=message,
        status="PENDING",
    )
    
    blocked_date = BlockedDate(
        date=ev_date,
        note=f"Auto-blocked for inquiry from {full_name}"
    )
    db.session.add(blocked_date)
    
    db.session.add(inq)
    db.session.commit()
    notify_new_inquiry(inq)
    return jsonify({"success": True, "id": inq.id, "message": "Inquiry submitted successfully"}), 201


@app.route("/api/contact", methods=["POST"])
def api_submit_contact():
    if not rate_limit(f"contact:{client_ip()}", max_hits=5, window_seconds=3600):
        return jsonify({"error": "Too many submissions. Please try again later."}), 429

    data = request.get_json(silent=True) or {}
    name = sanitize(data.get("name"), 120)
    phone = sanitize(data.get("phone"), 32) or None
    email = sanitize(data.get("email"), 255)
    message = sanitize(data.get("message"), 2000)

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Valid email is required"}), 400
    if not message:
        return jsonify({"error": "Message is required"}), 400

    msg = ContactMessage(name=name, phone=phone, email=email, message=message)
    db.session.add(msg)
    db.session.commit()
    notify_new_contact_message(msg)
    return jsonify({"success": True, "id": msg.id}), 201


@app.route("/api/settings/public")
def api_settings_public():
    """Return public-facing settings (phone, address, hours, etc.)."""
    public_keys = {
        "business_name", "business_phone", "whatsapp_number", "business_email",
        "address", "service_area", "working_hours", "instagram_url",
        "facebook_url", "tagline",
    }
    rows = Setting.query.filter(Setting.key.in_(public_keys)).all()
    return jsonify({r.key: json.loads(r.value) for r in rows})


# ─── Feedback routes (public) ────────────────────────────────────────────────

@app.route("/api/feedback", methods=["GET"])
def api_get_feedback():
    """Return all approved feedback entries, newest first."""
    rows = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify({"feedback": [r.to_dict() for r in rows]})


@app.route("/api/feedback", methods=["POST"])
def api_submit_feedback():
    if not rate_limit(f"feedback:{client_ip()}", max_hits=3, window_seconds=3600):
        return jsonify({"error": "Too many submissions. Please try again later."}), 429

    data = request.get_json(silent=True) or {}
    name = sanitize(data.get("name"), 120)
    email = sanitize(data.get("email"), 255) or None
    message = sanitize(data.get("message"), 2000)
    try:
        rating = max(1, min(5, int(data.get("rating", 5))))
    except (TypeError, ValueError):
        rating = 5

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not message:
        return jsonify({"error": "Message is required"}), 400

    fb = Feedback(name=name, email=email, message=message, rating=rating)
    db.session.add(fb)
    db.session.commit()
    return jsonify({"success": True, "id": fb.id}), 201


# ─── Auth routes ────────────────────────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    if not rate_limit(f"login:{client_ip()}", max_hits=5, window_seconds=900):
        return jsonify({"error": "Too many attempts. Wait 15 minutes."}), 429
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password.encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    session.permanent = True
    session["user_id"] = user.id
    session["user_email"] = user.email
    session["user_name"] = user.name
    return jsonify({"success": True, "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}})


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/auth/session")
def api_session():
    uid = session.get("user_id")
    if not uid:
        return jsonify({"authenticated": False}), 200
    user = db.session.get(User, uid)
    if not user:
        session.clear()
        return jsonify({"authenticated": False}), 200
    return jsonify({
        "authenticated": True,
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
    })


# ─── Admin API routes (all require auth) ────────────────────────────────────

@app.route("/api/admin/inquiries")
@login_required
def api_admin_list_inquiries():
    status = request.args.get("status")
    q = Inquiry.query
    if status and status.upper() in INQUIRY_STATUSES:
        q = q.filter(Inquiry.status == status.upper())
    rows = q.order_by(Inquiry.created_at.desc()).all()
    return jsonify({"inquiries": [r.to_dict() for r in rows], "total": len(rows)})


@app.route("/api/admin/inquiries/<int:inq_id>", methods=["GET", "PATCH", "DELETE"])
@login_required
def api_admin_inquiry_detail(inq_id):
    inq = db.session.get(Inquiry, inq_id)
    if not inq:
        return jsonify({"error": "Not found"}), 404
    if request.method == "GET":
        return jsonify(inq.to_dict())
    if request.method == "DELETE":
        bd = BlockedDate.query.filter_by(date=inq.event_date).first()
        if bd:
            db.session.delete(bd)
        db.session.delete(inq)
        db.session.commit()
        return jsonify({"success": True})
    # PATCH
    data = request.get_json(silent=True) or {}
    if "status" in data and data["status"].upper() in INQUIRY_STATUSES:
        inq.status = data["status"].upper()
    if "ownerNotes" in data:
        inq.owner_notes = sanitize(data["ownerNotes"], 2000)
    db.session.commit()
    return jsonify(inq.to_dict())


@app.route("/api/admin/calendar")
@login_required
def api_admin_calendar():
    rows = BlockedDate.query.order_by(BlockedDate.date.asc()).all()
    return jsonify({"blockedDates": [r.to_dict() for r in rows]})


@app.route("/api/admin/calendar/block", methods=["POST"])
@login_required
def api_admin_block_date():
    data = request.get_json(silent=True) or {}
    try:
        d = date.fromisoformat(data.get("date", ""))
    except ValueError:
        return jsonify({"error": "Invalid date"}), 400
    if BlockedDate.query.filter_by(date=d).first():
        return jsonify({"error": "Date already blocked"}), 400
    note = sanitize(data.get("note"), 500) or None
    bd = BlockedDate(date=d, note=note)
    db.session.add(bd)
    db.session.commit()
    return jsonify(bd.to_dict()), 201


@app.route("/api/admin/calendar/block/<int:block_id>", methods=["DELETE", "PATCH"])
@login_required
def api_admin_unblock_date(block_id):
    bd = db.session.get(BlockedDate, block_id)
    if not bd:
        return jsonify({"error": "Not found"}), 404
    if request.method == "DELETE":
        Inquiry.query.filter_by(event_date=bd.date).delete()
        db.session.delete(bd)
        db.session.commit()
        return jsonify({"success": True})
    data = request.get_json(silent=True) or {}
    if "note" in data:
        bd.note = sanitize(data["note"], 500) or None
    db.session.commit()
    return jsonify(bd.to_dict())


@app.route("/api/admin/photos")
@login_required
def api_admin_list_photos():
    category = request.args.get("category")
    q = Photo.query
    if category and category.upper() != "ALL":
        q = q.filter(Photo.category == category.upper())
    rows = q.order_by(Photo.sort_order.asc(), Photo.created_at.desc()).all()
    return jsonify({"photos": [r.to_dict() for r in rows], "total": len(rows)})


ALLOWED_IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@app.route("/api/admin/photos/upload", methods=["POST"])
@login_required
def api_admin_upload_photo():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    category = (request.form.get("category") or "OTHER").upper()
    if category not in PHOTO_CATEGORIES:
        category = "OTHER"
    name = sanitize(request.form.get("name"), 255) or None
    alt_text = sanitize(request.form.get("altText"), 255) or None

    orig = secure_filename(file.filename or "")
    ext = Path(orig).suffix.lower()
    if ext not in ALLOWED_IMG_EXT:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOADS_DIR / unique_name
    file.save(dest)

    width = height = None
    try:
        with Image.open(dest) as im:
            width, height = im.size
            # Resize if larger than 2000px on the long edge
            if max(im.size) > 2000:
                im.thumbnail((2000, 2000))
                im.save(dest)
                width, height = im.size
    except Exception as e:
        app.logger.warning("PIL open failed for %s: %s", dest, e)

    photo = Photo(
        filename=unique_name,
        url=f"/uploads/{unique_name}",
        category=category,
        name=name or orig,
        alt_text=alt_text,
        width=width,
        height=height,
        sort_order=0,
    )
    db.session.add(photo)
    db.session.commit()
    return jsonify(photo.to_dict()), 201


@app.route("/api/admin/photos/<int:photo_id>", methods=["PATCH", "DELETE"])
@login_required
def api_admin_photo_detail(photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({"error": "Not found"}), 404
    if request.method == "DELETE":
        try:
            (UPLOADS_DIR / photo.filename).unlink(missing_ok=True)
        except Exception as e:
            app.logger.warning("Photo file delete failed: %s", e)
        db.session.delete(photo)
        db.session.commit()
        return jsonify({"success": True})
    # PATCH
    data = request.get_json(silent=True) or {}
    if "category" in data and data["category"].upper() in PHOTO_CATEGORIES:
        photo.category = data["category"].upper()
    if "altText" in data:
        photo.alt_text = sanitize(data["altText"], 255) or None
    if "name" in data:
        photo.name = sanitize(data["name"], 255) or None
    if "sortOrder" in data:
        try:
            photo.sort_order = int(data["sortOrder"])
        except (TypeError, ValueError):
            pass
    db.session.commit()
    return jsonify(photo.to_dict())


@app.route("/api/admin/messages")
@login_required
def api_admin_list_messages():
    rows = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify({"messages": [r.to_dict() for r in rows], "total": len(rows)})


@app.route("/api/admin/messages/<int:msg_id>", methods=["PATCH", "DELETE"])
@login_required
def api_admin_message_detail(msg_id):
    msg = db.session.get(ContactMessage, msg_id)
    if not msg:
        return jsonify({"error": "Not found"}), 404
    if request.method == "DELETE":
        db.session.delete(msg)
        db.session.commit()
        return jsonify({"success": True})
    data = request.get_json(silent=True) or {}
    if "isRead" in data:
        msg.is_read = bool(data["isRead"])
    db.session.commit()
    return jsonify(msg.to_dict())


@app.route("/api/admin/stats")
@login_required
def api_admin_stats():
    today = date.today()
    month_start = date(today.year, today.month, 1)
    prev_month = (month_start - timedelta(days=1)).replace(day=1)

    this_month = Inquiry.query.filter(Inquiry.created_at >= month_start).all()
    last_month = Inquiry.query.filter(
        Inquiry.created_at >= prev_month, Inquiry.created_at < month_start
    ).all()

    def count_by_status(rows, status):
        return sum(1 for r in rows if r.status == status)

    this_count = len(this_month)
    last_count = len(last_month)
    change_pct = (
        round(((this_count - last_count) / last_count) * 100, 1)
        if last_count else (100.0 if this_count else 0.0)
    )

    # Popular event types (all time)
    all_inqs = Inquiry.query.all()
    type_counts = defaultdict(int)
    for r in all_inqs:
        type_counts[r.event_type] += 1
    popular = sorted(
        [{"type": k, "count": v} for k, v in type_counts.items()],
        key=lambda x: -x["count"],
    )

    # 6-month trend
    trend = []
    for i in range(5, -1, -1):
        m_idx = month_start.month - 1 - i
        y = month_start.year + (m_idx // 12)
        m = (m_idx % 12) + 1
        m_start = date(y, m, 1)
        nm = m + 1 if m < 12 else 1
        ny = y + 1 if m == 12 else y
        m_end = date(ny, nm, 1)
        cnt = Inquiry.query.filter(
            Inquiry.created_at >= m_start, Inquiry.created_at < m_end
        ).count()
        trend.append({"month": m_start.strftime("%b %Y"), "count": cnt})

    return jsonify({
        "thisMonth": {
            "inquiries": this_count,
            "confirmed": count_by_status(this_month, "CONFIRMED"),
            "pending": count_by_status(this_month, "PENDING"),
            "closed": count_by_status(this_month, "CLOSED"),
        },
        "lastMonth": {
            "inquiries": last_count,
            "confirmed": count_by_status(last_month, "CONFIRMED"),
            "pending": count_by_status(last_month, "PENDING"),
            "closed": count_by_status(last_month, "CLOSED"),
        },
        "changePercent": change_pct,
        "blockedDatesCount": BlockedDate.query.count(),
        "totalPhotos": Photo.query.count(),
        "unreadMessages": ContactMessage.query.filter_by(is_read=False).count(),
        "popularEventTypes": popular,
        "monthlyTrend": trend,
    })


@app.route("/api/admin/settings", methods=["GET", "PATCH"])
@login_required
def api_admin_settings():
    if request.method == "GET":
        rows = Setting.query.all()
        return jsonify({r.key: json.loads(r.value) for r in rows})
    data = request.get_json(silent=True) or {}
    for k, v in data.items():
        row = Setting.query.filter_by(key=k).first()
        if row:
            row.value = json.dumps(v)
        else:
            db.session.add(Setting(key=k, value=json.dumps(v)))
    db.session.commit()
    return jsonify({"success": True})


@app.route("/api/auth/password", methods=["PATCH"])
@login_required
def api_change_password():
    data = request.get_json(silent=True) or {}
    current = data.get("currentPassword") or ""
    new = data.get("newPassword") or ""
    if len(new) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
    user = db.session.get(User, session["user_id"])
    if not bcrypt.checkpw(current.encode(), user.password.encode()):
        return jsonify({"error": "Current password is incorrect"}), 401
    user.password = bcrypt.hashpw(new.encode(), bcrypt.gensalt(rounds=12)).decode()
    db.session.commit()
    return jsonify({"success": True})


# ─── Error handlers ─────────────────────────────────────────────────────────

@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "File too large (max 12 MB)"}), 413


@app.errorhandler(404)
def not_found(_):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(STATIC_DIR, "Aadhavan.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "").lower() != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)
