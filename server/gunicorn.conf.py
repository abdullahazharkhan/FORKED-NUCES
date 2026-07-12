"""Gunicorn defaults for the production container.

Every value that commonly needs tuning can be overridden through the
environment without rebuilding the image.
"""

import multiprocessing
import os


def env_int(name: str, default: int) -> int:
    return int(os.getenv(name, str(default)))


bind = os.getenv("GUNICORN_BIND", "0.0.0.0:8000")
workers = env_int(
    "WEB_CONCURRENCY",
    min(max(multiprocessing.cpu_count() * 2 + 1, 2), 4),
)
threads = env_int("GUNICORN_THREADS", 2)
worker_class = "gthread"

timeout = env_int("GUNICORN_TIMEOUT", 30)
graceful_timeout = env_int("GUNICORN_GRACEFUL_TIMEOUT", 30)
keepalive = env_int("GUNICORN_KEEPALIVE", 5)
max_requests = env_int("GUNICORN_MAX_REQUESTS", 1000)
max_requests_jitter = env_int("GUNICORN_MAX_REQUESTS_JITTER", 100)

accesslog = "-"
errorlog = "-"
capture_output = True
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")

# The container is reachable only through loopback or the private Compose
# network, so forwarded headers may only arrive from trusted local services.
forwarded_allow_ips = os.getenv("FORWARDED_ALLOW_IPS", "*")
worker_tmp_dir = "/dev/shm"
umask = 0o027
