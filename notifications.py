"""
Notifications — Gmail SMTP email + CallMeBot WhatsApp alerts.

Email:  Sends from aadhavandecors@gmail.com using a Gmail App Password.
        No domain verification needed.

WhatsApp: Sends via CallMeBot free API (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
        One-time activation required — see SETUP below.

SETUP:
  1. Gmail App Password:
       • Go to myaccount.google.com → Security → 2-Step Verification → App passwords
       • Create one named "Aadhavan" — copy the 16-char password
       • Set GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx in .env

  2. CallMeBot WhatsApp:
       • Save +34 644 59 21 00 in your phone contacts as "CallMeBot"
       • Send this WhatsApp message to that number:
           I allow callmebot to send me messages
       • You'll receive your API key in reply
       • Set CALLMEBOT_API_KEY=that_key in .env

Required .env vars:
  GMAIL_USER                 — aadhavandecors@gmail.com
  GMAIL_APP_PASSWORD         — 16-char app password from Google
  OWNER_NOTIFICATION_EMAIL   — where email alerts go (same as GMAIL_USER)
  OWNER_WHATSAPP_PHONE       — your WhatsApp number with country code (e.g. 918074896611)
  CALLMEBOT_API_KEY          — key you receive from CallMeBot
  PUBLIC_SITE_URL            — your ngrok or production URL
"""
from __future__ import annotations

import logging
import os
import re
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from urllib.parse import quote

import requests

log = logging.getLogger(__name__)


def _env(key: str) -> Optional[str]:
    val = os.getenv(key)
    return val.strip() if val else None


def _digits_only(phone: str) -> str:
    return re.sub(r"\D", "", phone or "")


def build_whatsapp_link(phone: str, message: str) -> str:
    digits = _digits_only(phone)
    if not digits:
        return ""
    return f"https://wa.me/{digits}?text={quote(message)}"


# ─── Email via Gmail SMTP ─────────────────────────────────────────────────────

def _send_email(subject: str, html: str, reply_to: Optional[str] = None) -> bool:
    gmail_user = _env("GMAIL_USER")
    gmail_password = _env("GMAIL_APP_PASSWORD")
    to_email = _env("OWNER_NOTIFICATION_EMAIL") or gmail_user

    if not (gmail_user and gmail_password and to_email):
        log.warning("[notifications] Gmail not configured — skipping email: %s", subject)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Aadhavan Decors <{gmail_user}>"
    msg["To"] = to_email
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.attach(MIMEText(html, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to_email, msg.as_string())
        log.info("[notifications] Email sent: %s", subject)
        return True
    except Exception as e:
        log.error("[notifications] Gmail error: %s", e)
        return False


# ─── WhatsApp via CallMeBot ───────────────────────────────────────────────────

def _send_whatsapp(message: str) -> bool:
    phone = _env("OWNER_WHATSAPP_PHONE")
    api_key = _env("CALLMEBOT_API_KEY")

    if not (phone and api_key):
        log.warning("[notifications] CallMeBot not configured — skipping WhatsApp")
        return False

    try:
        digits = _digits_only(phone)
        resp = requests.get(
            "https://api.callmebot.com/whatsapp.php",
            params={"phone": digits, "text": message, "apikey": api_key},
            timeout=10,
        )
        if resp.status_code == 200:
            log.info("[notifications] WhatsApp sent")
            return True
        log.error("[notifications] CallMeBot error %s: %s", resp.status_code, resp.text)
        return False
    except requests.RequestException as e:
        log.error("[notifications] CallMeBot request failed: %s", e)
        return False


# ─── Shared email template helpers ───────────────────────────────────────────

_BASE_STYLE = """
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #f6f4ef; color: #1a1a1a; margin: 0; padding: 24px; }
  .card { max-width: 560px; margin: 0 auto; background: #fff;
          border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  h1 { font-size: 20px; margin: 0 0 4px; color: #7A57A0; }
  .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 8px 0; font-size: 14px; vertical-align: top; }
  td.k { color: #666; width: 34%; }
  td.v { color: #1a1a1a; font-weight: 500; }
  .msg { background: #faf6ef; padding: 12px 14px; border-radius: 8px;
         font-size: 14px; margin-top: 8px; white-space: pre-wrap; }
  .actions { margin-top: 22px; display: flex; gap: 10px; flex-wrap: wrap; }
  .btn { display: inline-block; padding: 12px 18px; border-radius: 8px;
         text-decoration: none; font-weight: 600; font-size: 14px; }
  .btn-wa { background: #25D366; color: #fff !important; }
  .btn-call { background: #1a1a1a; color: #fff !important; }
  .btn-admin { background: #fff; color: #7A57A0 !important;
               border: 1.5px solid #7A57A0; }
  .foot { color: #999; font-size: 12px; margin-top: 24px; text-align: center; }
"""


def _row(label: str, value) -> str:
    if value in (None, "", "None"):
        return ""
    return f'<tr><td class="k">{label}</td><td class="v">{value}</td></tr>'


# ─── Public API (imported by app.py) ─────────────────────────────────────────

def notify_new_inquiry(inq) -> None:
    site_url = _env("PUBLIC_SITE_URL") or ""
    admin_url = f"{site_url}/admin/" if site_url else "#"

    greeting = (
        f"Hi {inq.full_name}, thank you for your inquiry with Aadhavan Event "
        f"Design regarding your event on {inq.event_date}. I'd love to discuss the details with you."
    )
    wa_link = build_whatsapp_link(inq.phone, greeting)
    tel_link = f"tel:{_digits_only(inq.phone)}"

    actions_html = ""
    if wa_link:
        actions_html += f'<a class="btn btn-wa" href="{wa_link}">💬 Reply on WhatsApp</a>'
    actions_html += f'<a class="btn btn-call" href="{tel_link}">📞 Call {inq.phone}</a>'
    if site_url:
        actions_html += f'<a class="btn btn-admin" href="{admin_url}">Open Dashboard</a>'

    html = f"""<!doctype html>
<html><head><style>{_BASE_STYLE}</style></head><body>
  <div class="card">
    <h1>✨ New Inquiry — Aadhavan</h1>
    <div class="sub">Someone just submitted the booking form on your website.</div>
    <table>
      {_row("Name", inq.full_name)}
      {_row("Phone", inq.phone)}
      {_row("Email", inq.email)}
      {_row("Service", inq.service_type)}
      {_row("Event date", inq.event_date)}
      {_row("Guests", inq.guest_count)}
      {_row("Venue", inq.venue)}
    </table>
    {f'<div class="msg"><strong>Requirements:</strong><br>{inq.message}</div>' if inq.message else ''}
    <div class="actions">{actions_html}</div>
    <div class="foot">Inquiry #{inq.id} · Aadhavan Event Design</div>
  </div>
</body></html>"""

    subject = f"✨ New inquiry: {inq.full_name} — {inq.event_date}"
    _send_email(subject, html, reply_to=inq.email or None)

    # WhatsApp alert
    wa_msg = (
        f"✨ New Inquiry - Aadhavan\n"
        f"Name: {inq.full_name}\n"
        f"Phone: {inq.phone}\n"
        f"Date: {inq.event_date}\n"
        f"Service: {inq.service_type or 'Not specified'}\n"
        f"Message: {(inq.message or '')[:200]}"
    )
    _send_whatsapp(wa_msg)


def notify_new_contact_message(msg) -> None:
    site_url = _env("PUBLIC_SITE_URL") or ""

    wa_link = build_whatsapp_link(
        msg.phone or "",
        f"Hi {msg.name}, thanks for reaching out to Aadhavan Event Design.",
    ) if msg.phone else ""
    tel_link = f"tel:{_digits_only(msg.phone)}" if msg.phone else ""

    actions_html = ""
    if wa_link:
        actions_html += f'<a class="btn btn-wa" href="{wa_link}">💬 Reply on WhatsApp</a>'
    if tel_link:
        actions_html += f'<a class="btn btn-call" href="{tel_link}">📞 Call</a>'
    actions_html += f'<a class="btn btn-admin" href="mailto:{msg.email}">✉ Reply by Email</a>'

    html = f"""<!doctype html>
<html><head><style>{_BASE_STYLE}</style></head><body>
  <div class="card">
    <h1>📩 New Contact Message — Aadhavan</h1>
    <div class="sub">New message from the contact form on your website.</div>
    <table>
      {_row("Name", msg.name)}
      {_row("Email", msg.email)}
      {_row("Phone", msg.phone)}
    </table>
    <div class="msg">{msg.message}</div>
    <div class="actions">{actions_html}</div>
    <div class="foot">Message #{msg.id} · Aadhavan Event Design</div>
  </div>
</body></html>"""

    subject = f"📩 Contact message: {msg.name}"
    _send_email(subject, html, reply_to=msg.email)

    # WhatsApp alert
    wa_msg = (
        f"📩 New Contact - Aadhavan\n"
        f"Name: {msg.name}\n"
        f"Email: {msg.email}\n"
        f"Phone: {msg.phone or 'Not provided'}\n"
        f"Message: {(msg.message or '')[:300]}"
    )
    _send_whatsapp(wa_msg)
