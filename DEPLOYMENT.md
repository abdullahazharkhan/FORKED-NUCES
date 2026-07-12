# Production deployment runbook

This runbook assumes the frontend runs on Vercel and the API stack runs on one
Docker host. The browser talks only to same-origin Next.js BFF routes. Vercel
talks to Django over the public HTTPS API domain.

## 1. Host and DNS prerequisites

- Install Docker Engine with the Compose v2 plugin.
- Point the API domain's `A`/`AAAA` records at the Docker host.
- Allow inbound TCP `80` and TCP/UDP `443`; block public port `8000`, PostgreSQL,
  and Redis at the cloud firewall and host firewall.
- Give the host enough disk for PostgreSQL, images, logs, and at least two local
  backup generations. Production backups must also leave the host.

The Compose file binds Gunicorn to `127.0.0.1` for diagnostics. Caddy is the
only service that accepts public traffic.

## 2. Create production configuration

Keep production configuration outside the checkout:

```bash
sudo install -m 600 .env.production.example /etc/forked-nuces/production.env
sudoedit /etc/forked-nuces/production.env
```

Generate a Django key rather than inventing one:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Replace every hostname, database password, signing key, and SMTP credential.
Keep `ENVIRONMENT=production`, `DEBUG=False`, the secure cookie flags enabled,
and every public URL on HTTPS. In Vercel, set server-only
`DRF_API_BASE_URL=https://<API_DOMAIN>`; do not create a public browser API
variable.

Validate interpolation before starting anything:

```bash
docker compose \
  --env-file /etc/forked-nuces/production.env \
  --profile production \
  config --quiet
```

## 3. First deployment

```bash
docker compose \
  --env-file /etc/forked-nuces/production.env \
  --profile production \
  up -d --build
```

Compose waits for PostgreSQL and Redis, runs migrations, collects static files,
waits for Django readiness, and then starts Caddy. If a one-shot job fails,
Gunicorn does not start; inspect it instead of bypassing the gate:

```bash
docker compose --env-file /etc/forked-nuces/production.env ps --all
docker compose --env-file /etc/forked-nuces/production.env logs migrate collectstatic backend caddy
```

Validate both probes and one authenticated application flow:

```bash
curl --fail --show-error https://api.example.com/health/
curl --fail --show-error https://api.example.com/ready/
```

`/health/` proves the process is alive. `/ready/` proves required backing
services are reachable. Monitor readiness, HTTP 5xx rate, latency, disk space,
container restarts, and certificate renewal.

Every Django response includes `X-Request-ID`, and Django log lines include the
same value as `request_id=...`. Preserve that response header in incident
reports so Caddy and application events can be correlated without logging
credentials or request bodies.

Before opening production traffic, connect both deployment surfaces to an
alert destination:

- On Vercel, retain Runtime Logs and configure either an error-tracking
  integration or a Log Drain for function errors. Alert on sustained 5xx and
  timeout rates. The centralized BFF client emits structured start/done/failure
  records containing route, status, duration, and the same safe request ID; it
  deliberately omits query strings, request bodies, cookies, and tokens.
- On the API host, ship Caddy/Gunicorn/Django stdout to the host log collector
  and alert on `/ready/` failure, restarts, disk pressure, certificate failure,
  PostgreSQL availability, and backup-unit failure.
- Run a synthetic login plus project-list check from outside the host. Liveness
  alone does not prove the BFF, authentication, database, and response-rendering
  path works.

Provider selection and notification recipients are deployment-owner choices,
so they are intentionally not embedded in the repository. Record the selected
destinations and an on-call contact in the production change ticket.

## 4. Routine release

1. Review CI: backend PostgreSQL/Redis tests, migration checks, deployment
   checks, frontend lint/typecheck/tests/build, dependency audits, and image
   build must all pass.
2. Take and verify a database backup.
3. Set `IMAGE_TAG` to the release commit or immutable release identifier.
4. Pull the approved commit and run the same `up -d --build` command.
5. Confirm the migration/static jobs completed, both health endpoints pass, and
   login/refresh/logout plus the main project workflow work from the frontend.

Application startup never runs schema migrations itself. The dedicated
`migrate` service makes schema failure visible and prevents an unhealthy backend
from receiving traffic.

## 5. Backup and restore

The repository includes an atomic backup script. It creates a custom-format
archive with restrictive permissions, validates the archive table of contents,
writes and verifies a SHA-256 checksum, then applies the configured retention:

```bash
sudo install -d -m 700 /var/backups/forked-nuces
sudo sh ops/backup-postgres.sh
```

Install the supplied systemd unit and timer for daily execution:

```bash
sudo install -m 644 ops/systemd/forked-nuces-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now forked-nuces-backup.timer
sudo systemctl start forked-nuces-backup.service
sudo systemctl status forked-nuces-backup.service
```

For failure alerts, route failed systemd units into the host's monitoring
system. Set `BACKUP_MIRROR_DIR` only after mounting separately protected,
off-host storage at that path, then add that mount to the service unit's
`ReadWritePaths`. A same-host directory is not disaster recovery. Do not treat
the `postgres_data` Docker volume as a backup.

At least quarterly, restore the newest mirrored archive into an isolated
database and run Django checks plus a representative read-only application
flow. Record the restore duration and result; archive parsing alone is not a
substitute for a real restore drill.

Before restoring production, stop write traffic, take one final backup, and
document the exact target database. `pg_restore --clean` is destructive; never
run it against a target that has not been independently verified.

## 6. Rollback and incident notes

- Roll application code back by checking out the matching release, restoring
  the previous `IMAGE_TAG`, and starting the retained image with `--no-build`.
  Never rebuild current source under an old release tag.
- Prefer backward-compatible, expand/contract migrations. Do not reverse a data
  migration unless its reverse operation and backup have been tested.
- If a release changed the schema incompatibly, restore the matching database
  backup rather than forcing an old image onto a new schema.
- If a secret may have leaked, rotate the Django key, database password, SMTP
  credential, and affected user sessions, then rebuild/restart the stack.
- Keep Docker and Caddy logs on stdout/stderr; Compose rotates local JSON logs.
  Never log passwords, JWTs, verification tokens, or full authorization headers.

Redis stores cache/throttle state only and is intentionally non-persistent.
PostgreSQL is the system of record.
