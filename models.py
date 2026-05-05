"""
Aadhavan — Database models (SQLAlchemy + SQLite).

These mirror the Prisma schema in AADHAVAN_BACKEND_SPEC.md section 'DATABASE SCHEMA',
adapted for SQLite (no enums — we use Python constants and CHECK constraints where
it matters; JSON stored as TEXT; dates stored as ISO strings for simplicity).
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ─── Enum-ish constants (SQLite has no enum type) ────────────────────────────

EVENT_TYPES = {
    "WEDDING", "SANGEET", "HALDI", "MEHNDI", "RECEPTION",
    "BIRTHDAY", "ANNIVERSARY", "CORPORATE", "OTHER",
}
CONTACT_METHODS = {"CALL", "WHATSAPP", "EMAIL"}
INQUIRY_STATUSES = {"PENDING", "CONFIRMED", "CLOSED"}
PHOTO_CATEGORIES = {
    "MANDAP", "SANGEET", "HALDI", "RECEPTION", "MEHNDI",
    "BIRTHDAY", "CORPORATE", "OTHER",
}
ROLES = {"ADMIN", "SUPER_ADMIN"}


# ─── Models ──────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)  # bcrypt hash
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(32), default="ADMIN", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Inquiry(db.Model):
    __tablename__ = "inquiries"
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(32), nullable=False)
    email = db.Column(db.String(255), nullable=True)  # prototype form doesn't collect email
    event_type = db.Column(db.String(32), default="OTHER", nullable=False)
    event_date = db.Column(db.Date, nullable=False, index=True)
    guest_count = db.Column(db.Integer, nullable=True)
    venue = db.Column(db.String(255), nullable=True)
    contact_method = db.Column(db.String(16), default="WHATSAPP", nullable=False)
    service_type = db.Column(db.String(64), nullable=True)  # prototype adds this
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(16), default="PENDING", nullable=False, index=True)
    owner_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "phone": self.phone,
            "email": self.email,
            "eventType": self.event_type,
            "eventDate": self.event_date.isoformat() if self.event_date else None,
            "guestCount": self.guest_count,
            "venue": self.venue,
            "contactMethod": self.contact_method,
            "serviceType": self.service_type,
            "message": self.message,
            "status": self.status,
            "ownerNotes": self.owner_notes,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class BlockedDate(db.Model):
    __tablename__ = "blocked_dates"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, unique=True, nullable=False, index=True)
    note = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "note": self.note,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Photo(db.Model):
    __tablename__ = "photos"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)  # on-disk name in uploads/
    url = db.Column(db.String(500), nullable=False)  # /uploads/<filename>
    category = db.Column(db.String(32), nullable=False, index=True)
    sort_order = db.Column(db.Integer, default=0, index=True)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    alt_text = db.Column(db.String(255), nullable=True)
    name = db.Column(db.String(255), nullable=True)  # display name for lightbox
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "category": self.category,
            "sortOrder": self.sort_order,
            "width": self.width,
            "height": self.height,
            "altText": self.alt_text,
            "name": self.name,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(32), nullable=True)
    email = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "message": self.message,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Setting(db.Model):
    __tablename__ = "settings"
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)  # JSON-encoded string
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Feedback(db.Model):
    __tablename__ = "feedbacks"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    message = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, default=5, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "rating": self.rating,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
