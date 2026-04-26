"""
Seed script — creates the initial owner account + default settings.

Run once after install:
    python seed.py

Default credentials (CHANGE AFTER FIRST LOGIN via Settings page):
    email:    owner@aadhavan.com
    password: aadhavan2025
"""
import json
import os
import sys

import bcrypt
from dotenv import load_dotenv

load_dotenv()

from app import app  # noqa: E402
from models import Setting, User, db  # noqa: E402

DEFAULT_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "owner@aadhavan.com")
DEFAULT_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "aadhavan2025")

DEFAULT_SETTINGS = {
    "business_name": "Aadhavan Event Design",
    "business_phone": "+91 80748 96611",
    "whatsapp_number": "+91 80748 96611",
    "business_email": "hello@aadhavan.com",
    "address": "Collierville, Tennessee",
    "service_area": "Serving Memphis & surrounding areas",
    "working_hours": {"weekdays": "9:00 AM – 7:00 PM", "sunday": "By appointment"},
    "instagram_url": "https://instagram.com/aadhavan_decors",
    "facebook_url": "",
    "tagline": "Creating magical celebrations since 2019",
}


def seed():
    with app.app_context():
        db.create_all()

        # Owner account
        existing = User.query.filter_by(email=DEFAULT_EMAIL).first()
        if existing:
            print(f"✔ Owner account already exists: {DEFAULT_EMAIL}")
        else:
            hashed = bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt(rounds=12)).decode()
            user = User(email=DEFAULT_EMAIL, password=hashed, name="Aadhavan Owner", role="ADMIN")
            db.session.add(user)
            db.session.commit()
            print(f"✔ Created owner: {DEFAULT_EMAIL}  /  password: {DEFAULT_PASSWORD}")
            print("  ⚠ CHANGE THIS PASSWORD in the admin dashboard after first login.")

        # Default settings
        added = 0
        for k, v in DEFAULT_SETTINGS.items():
            row = Setting.query.filter_by(key=k).first()
            if not row:
                db.session.add(Setting(key=k, value=json.dumps(v)))
                added += 1
        db.session.commit()
        print(f"✔ Seeded {added} new settings (existing ones left untouched).")
        print("\nDone. Start the server with:  python app.py")


if __name__ == "__main__":
    seed()
