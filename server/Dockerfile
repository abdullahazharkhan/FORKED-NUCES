FROM python:3.12.13-slim-bookworm@sha256:8a7e7cc04fd3e2bd787f7f24e22d5d119aa590d429b50c95dfe12b3abe52f48b AS wheels

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build
COPY requirements.txt ./requirements.txt
RUN python -m pip wheel \
    --no-cache-dir \
    --no-deps \
    --wheel-dir /wheels \
    --requirement requirements.txt


FROM python:3.12.13-slim-bookworm@sha256:8a7e7cc04fd3e2bd787f7f24e22d5d119aa590d429b50c95dfe12b3abe52f48b AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --create-home --shell /usr/sbin/nologin app

WORKDIR /app
COPY requirements.txt ./requirements.txt
COPY --from=wheels /wheels /wheels
RUN python -m pip install \
    --no-cache-dir \
    --no-deps \
    --no-index \
    --find-links=/wheels \
    --requirement requirements.txt \
    && rm -rf /wheels

COPY --chown=app:app . .
RUN mkdir -p /app/staticfiles \
    && chown app:app /app/staticfiles

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-c", "import os, urllib.request; host = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')[0].strip() or 'localhost'; request = urllib.request.Request('http://127.0.0.1:8000/health/', headers={'Host': host, 'X-Forwarded-Proto': 'https'}); urllib.request.urlopen(request, timeout=3)"]

CMD ["gunicorn", "--config", "gunicorn.conf.py", "drf_backend.wsgi:application"]
