"""
Gunicorn config — production-safe defaults for a small Flask app.

Tuned for a 512 MB / 1 vCPU container (Railway / Render / Fly smallest tier).
If you upgrade the plan later, bump `workers` per the (2 * cores) + 1 rule.
"""
import os

# Bind to the port the host injects. Railway/Render set $PORT automatically.
bind = f"0.0.0.0:{os.getenv('PORT', '8080')}"

# 2 workers × 2 threads handles light traffic fine on 512MB.
# Don't crank this — SQLite doesn't love many concurrent writers.
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
threads = int(os.getenv("GUNICORN_THREADS", "2"))
worker_class = "gthread"

# Kill + restart a worker if a request hangs longer than 30s.
timeout = 30
graceful_timeout = 20
keepalive = 5

# Recycle workers after N requests to cap memory leaks from any dependency.
max_requests = 1000
max_requests_jitter = 100

# Log to stdout/stderr — Railway/Render capture these automatically.
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
access_log_format = (
    '%(h)s "%(r)s" %(s)s %(b)sB %(L)ss "%(f)s" "%(a)s"'
)
