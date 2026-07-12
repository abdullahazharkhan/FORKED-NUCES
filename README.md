<div align="center">

# 🍴 FORKED NUCES

**The collaboration platform built for FAST NUCES students.**

Share your projects. Find contributors. Build together.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-forked--nuces.vercel.app-6C63FF?style=for-the-badge&logo=vercel)](https://forked-nuces.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

</div>

---

## What is FORKED NUCES?

FORKED NUCES is an **internal open-source collaboration platform** for FAST NUCES students. Think of it as GitHub meets a university social feed — but restricted to the NU community.

Only users with a **`@nu.edu.pk` email** can register. Once verified, students can:

- 📌 **Post projects** with GitHub links and technology tags
- 🔍 **Discover** other students' work via a smart recommendation engine
- 🐛 **Open issues** on projects they want to contribute to
- 🤝 **Collaborate** — close issues and record who helped
- ❤️ **Like and comment** on projects
- 🏆 **Climb leaderboards** ranked by contribution score
- 🔔 **Stay informed** through in-app notifications and activity feeds
- 🛡️ **Report abuse** and track moderation outcomes privately

```text
Browser (HTTPS)
  -> Vercel / Next.js 16 BFF (HTTP-only auth cookies)
  -> HTTPS API domain
  -> Caddy (TLS termination)
  -> Gunicorn / Django REST Framework
  -> Django ORM -> PostgreSQL 16
                -> Redis 7 (shared cache and throttling)
```

Only Caddy publishes public ports `80` and `443`. Gunicorn is bound to host
loopback for local diagnostics and is otherwise reached through the private
Compose network. PostgreSQL and Redis are never published to the host.

---

## ✨ Highlights

| | |
|---|---|
| 🔐 **Verified Community** | Only `@nu.edu.pk` emails — no outsiders |
| 🤖 **Smart Recommendations** | 4-mode engine: trending, skill-match, needs-help, network |
| ⚡ **Redis Rate Limiting** | Shared throttling across all workers — accurate at scale |
| 🛡️ **Secure Auth** | Session-versioned JWTs, rotating refresh tokens, password recovery, and global revocation |
| 🗄️ **ORM Data Layer** | Django ORM queries, annotations, and transactions with no hand-written runtime SQL |
| 🐳 **Hardened Containers** | Non-root backend, health-gated startup, private data network, and automatic HTTPS |
| 📧 **Branded Emails** | HTML verification emails via Gmail SMTP |
| ⚛️ **Atomic Transactions** | All multi-step operations roll back on failure |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (TypeScript) | React framework with App Router and same-origin BFF routes |
| **Tailwind CSS + HeroUI** | Styling and UI components |
| **TanStack React Query** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form handling and validation |
| **Framer Motion** | Animations |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| **Django 5.2 + DRF** | REST API framework |
| **PostgreSQL 16** | Relational database managed through Django models and migrations |
| **Redis 7** | Rate limiting store + cache backend |
| **Gunicorn** | Production WSGI server |
| **Docker + Docker Compose** | Backend, migration/static jobs, PostgreSQL, Redis, and Caddy |
| **Caddy** | Automatic TLS and reverse proxy; Gunicorn is not public |
| **Vercel** | Frontend CDN hosting |
| **Gmail SMTP** | Transactional emails |

---

## ✨ Features

### 🔐 Authentication
- Registration restricted to `@nu.edu.pk` emails only
- Email verification with cryptographically random tokens (24-hour expiry)
- JWT login: **15-minute access tokens** + **7-day rotating refresh tokens**
- Token blacklisting on logout — stolen tokens are permanently invalidated
- HTTP-only cookies (never `localStorage`)
- Next.js middleware auto-redirects unauthenticated users to `/login`
- Enumeration-safe password reset, authenticated password change, and sign-out-all
- Registration, verification resend, and reset requests use the same accepted
  response and one email-delivery attempt for eligible and ineligible accounts
- Structured account export and anonymizing deletion with contribution retention

### 👤 User Profiles
- Profile: name, bio, GitHub username, avatar
- Skill tagging — list your technologies
- Debounced server-side user search by name or NU email, skill filtering, and pagination
- Activity stats: projects created, issues collaborated on, comments made

### 📂 Projects
- Create / edit / delete projects with Markdown descriptions and GitHub URL
- Technology tag system for categorisation
- Server-side text search, tag/issue-status filters, ordering, and real pagination
- Owner-only edit and delete permissions

### 🐛 Issue Tracking
- Create issues on any project (Open by default)
- Apply to contribute or invite another student; both paths require explicit acceptance
- Close issues and credit only accepted contributors — **collaborators are tracked**
- Markdown support for issue descriptions
- Per-project issue limits and bounded nested detail responses prevent oversized
  project payloads while list endpoints expose exact open/closed/total counts

### 💬 Social
- Like / Unlike projects *(one like per user per project, enforced at DB level)*
- Comment on projects
- Delete comments *(author or project owner only)*
- In-app notifications for comments, likes, collaboration decisions, issue credit, and moderation
- Report users, projects, issues, or comments and track report status

### 📊 Community Activity
- Contribution leaderboard backed by ORM-computed metrics
- Recent project/comment activity feed and personal activity statistics
- Dedicated notification and collaboration inboxes with paginated history

### 🤖 Recommendation Engine
| Mode | What it shows |
|---|---|
| `spotlight` | Trending projects by engagement × recency |
| `with-issues` | Projects needing contributors (most open issues) |
| `skill-match` | Projects whose tags match your skills |
| `network` | Projects from users you've collaborated with |

---

## 🔌 API Endpoints

> **Base URL:** `https://api.example.com` (replace with your configured `API_DOMAIN`)

### Auth — `/api/auth/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register/` | ❌ | Submit an enumeration-safe registration request |
| POST | `/verify-email/` | ❌ | Verify email with token |
| POST | `/resend-verification-email/` | ❌ | Submit an enumeration-safe verification-email request |
| POST | `/login/` | ❌ | Login — returns JWT tokens |
| POST | `/logout/` | ✅ | Logout — blacklists refresh token |
| POST | `/logout-all/` | ✅ | Revoke every session immediately |
| POST | `/password-reset/request/` | ❌ | Request an enumeration-safe reset email |
| POST | `/password-reset/confirm/` | ❌ | Complete a single-use password reset |
| POST | `/password/change/` | ✅ | Change password and revoke all sessions |
| GET | `/me/` | ✅ | Get current user's profile |
| PATCH | `/me/update/` | ✅ | Update profile / skills |
| GET | `/me/export/` | ✅ | Download a secret-free structured data export |
| POST | `/me/delete/` | ✅ | Anonymize/deactivate account and revoke sessions |
| GET | `/users/` | ✅ | Paginated/searchable user directory (excluding self) |
| GET | `/users/<id>/` | ✅ | Get a specific user |
| GET | `/users/search/` | ✅ | Search users by name/email with skill and ordering filters |
| POST | `/api/token/refresh/` | ❌ | Refresh access token |

### Projects — `/api/projects/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET, POST | `/` | ✅ | List own projects / Create project |
| GET | `/all/` | ✅ | List all projects |
| GET, PUT, DELETE | `/<id>/` | ✅ | Get, update, or delete own project |
| GET | `/public/<id>/` | ✅ | Get any project (public view) |
| GET | `/by-user/<user_id>/` | ✅ | Projects by a specific user |
| POST | `/issues/` | ✅ | Create an issue |
| PATCH | `/issues/<id>/status/` | ✅ | Update issue status |
| GET, PUT, DELETE | `/issues/<id>/` | ✅ | Manage a specific issue |
| GET, POST | `/issues/<id>/collaboration-requests/` | ✅ | List/apply/invite for collaboration |
| GET | `/collaboration-requests/mine/` | ✅ | Incoming and outgoing collaboration inbox |
| PATCH | `/collaboration-requests/<id>/` | ✅ | Accept/reject/withdraw/cancel a request |
| POST | `/issues/close-with-collaborator/` | ✅ | Close issue + record collaborators |
| GET | `/<id>/collaborators/` | ✅ | List project collaborators |
| GET | `/collaborated/by-user/<id>/` | ✅ | Projects a user collaborated on |
| GET | `/recommended/?mode=<mode>` | ✅ | Smart recommendations |
| GET | `/top-contributors/` | ✅ | Leaderboard |
| GET | `/user-stats/` | ✅ | Activity stats |
| GET | `/recent-activity/` | ✅ | Global activity feed |

### Interactions — `/api/interactions/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/comments/` | ✅ | Post a comment |
| GET | `/comments/project/<id>/` | ✅ | Comments on a project |
| DELETE | `/comments/<id>/` | ✅ | Delete a comment |
| POST | `/likes/toggle/` | ✅ | Toggle like on a project |

### Notifications — `/api/notifications/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | Paginated notification history; supports unread filter |
| GET | `/unread-count/` | ✅ | Unread notification count |
| POST | `/<id>/read/` | ✅ | Mark one notification read |
| POST | `/mark-all-read/` | ✅ | Mark all notifications read |

### Moderation — `/api/moderation/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET, POST | `/reports/` | ✅ | List submitted reports or report content |
| GET | `/staff/reports/` | Staff | Paginated moderation queue |
| PATCH | `/staff/reports/<id>/` | Staff | Review and resolve a report |

---

## 🗄️ Database

### Tables
| Table | What it stores |
|---|---|
| `accounts_user` | Users — email, name, bio, GitHub, avatar |
| `accounts_skill` | Skills per user |
| `accounts_verificationtoken` | Email verification tokens |
| `projects_project` | Projects — title, description, GitHub URL |
| `projects_tag` | Technology tags per project |
| `projects_issue` | Issues (open / closed) |
| `projects_collaborator` | Who helped close each issue |
| `projects_collaborationrequest` | Applications, invitations, consent, and decisions |
| `interactions_comment` | Comments on projects |
| `interactions_like` | Likes (unique per user + project) |
| `notifications_notification` | In-app notification history/read state |
| `moderation_report` | Abuse reports, immutable snapshots, and resolution state |

### Data access

Application queries use Django ORM querysets, annotations, subqueries, and
transactions. Schema changes are represented by Django migrations. There are
no application-managed PostgreSQL views, functions, triggers, or hand-written
runtime SQL to provision separately.

> Self-likes are blocked in the API layer before a `Like` record is created.
---

## 🔐 Security

- **NU email enforcement** — validated at both model and serializer level
- **Email verification** — 24-hour expiry, tokens cannot be reused (`used_at` tracked)
- **Rotating JWT tokens** — old refresh tokens blacklisted on every refresh
- **Session-version enforcement** — password changes, resets, deletion, and sign-out-all invalidate access tokens immediately
- **HTTP-only host cookies** — production tokens use browser-enforced `__Host-` names and are not accessible to JavaScript
- **Redis rate limiting** — 30 req/min (anonymous), 200 req/min (authenticated), shared across all Gunicorn workers
- **Bounded user content** — 50 skills, 25 project tags, 100 issues per project, 10,000-character project/issue descriptions, and 2,000-character comments
- **Safe Markdown rendering** — raw HTML and dynamic code renderers are disabled, with the same HTML allowlist applied during SSR and in the browser
- **Owner-only mutations** — edit/delete enforced in every view
- **BFF boundary** — the browser calls same-origin Next.js routes; only the BFF calls the HTTPS API
- **CORS/CSRF allowlists** — explicit deployment environment variables, never wildcards
- **TLS-only production path** — Caddy terminates HTTPS and Gunicorn stays private
- **`DEBUG=False` in production** — no stack traces exposed
- **Atomic transactions** — registration, project creation, issue closure, likes all roll back on failure
- **Consent locking** — collaborator attribution re-checks accepted requests under consistent database locks
- **CSP and secure headers** — browser/API responses restrict framing, MIME sniffing, permissions, and production content sources
- **Correlation IDs** — every Django response and application log can be traced with `X-Request-ID`

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20.9+
- PostgreSQL 16
- Redis 7 *(required in production for shared throttling and caching)*

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/FORKED-NUCES.git
cd FORKED-NUCES
```

### 2. Backend Setup
```bash
cd server

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and fill in your values (DB password, secret key, etc.)

# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE forked_nuces;"

# Apply Django migrations (creates all tables)
python manage.py migrate

# (Optional) Create a superuser for Django admin
python manage.py createsuperuser

# Start the development server
python manage.py runserver
# → API available at http://127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm ci

# Set up environment variables
cp .env.example .env.local
# Open .env.local — defaults should work for local dev

# Start the development server
npm run dev
# → App available at http://localhost:3000
```

> **Email in local dev:** Set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in your `.env` — verification emails will print to the terminal instead of being sent.

---

## ✅ Verification

```bash
# Backend fast suite (SQLite test settings)
cd server
python manage.py test --settings=drf_backend.test_settings

# Frontend static checks and unit tests
cd ../client
npm run lint
npm run typecheck
npm test
npm run build
```

Browser tests live in `client/e2e` and run with `npm run test:e2e`. They expect
a reachable Django API plus `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` for the
authenticated story. CI provisions PostgreSQL and Redis, applies every
migration, seeds a disposable verified user, starts both servers, and retains
Playwright traces/screenshots/video only when a test fails.

The CI matrix also checks a clean PostgreSQL migration, Django deployment
settings, dependency advisories, Compose/Caddy configuration, a non-root image,
and the production Next.js build.

---

## ⚙️ Environment Variables

The templates have separate purposes:

- `server/.env.example` — manual local Django development.
- `client/.env.example` — local Next.js/Vercel BFF configuration.
- `.env.example` — local Docker Compose configuration.
- `.env.production.example` — fail-closed production Compose template.

Important variables:

| Variable | Description |
|---|---|
| `ENVIRONMENT` | Explicit runtime mode: `development`, `test`, or `production` |
| `SECRET_KEY` | Required Django signing key; generate a unique value per environment |
| `DB_*` | PostgreSQL connection and credentials |
| `REDIS_URL` | Shared production cache and throttle store |
| `ALLOWED_HOSTS` | Exact API hostnames accepted by Django |
| `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Exact HTTPS frontend/API origins |
| `FRONTEND_BASE_URL` | Public HTTPS frontend used in verification links |
| `EMAIL_*` | SMTP provider settings; console email is development-only |
| `API_DOMAIN` | Public API hostname for Caddy certificates and routing |
| `DRF_API_BASE_URL` | Server-only HTTPS API URL used by Next.js BFF routes |
| `BACKUP_DIR`, `BACKUP_RETENTION_DAYS` | Host backup destination and rotation policy |
| `BACKUP_MIRROR_DIR` | Separately mounted/off-host backup mirror destination |

No Django URL or access token is exposed through a `NEXT_PUBLIC_*` variable.
Production startup rejects missing secrets and unsafe HTTP/development settings.

## Container deployment

For local containers, copy `.env.example` to `.env`, generate `SECRET_KEY`, set
`DB_PASSWORD`, then run:

```bash
docker compose up --build
```

The API is available only on `http://127.0.0.1:8000` for local diagnostics.

For production, store the populated production template outside the repository
and start the `production` profile:

```bash
sudo install -m 600 .env.production.example /etc/forked-nuces/production.env
# Edit every placeholder, point API_DOMAIN DNS at this host, then:
docker compose \
  --env-file /etc/forked-nuces/production.env \
  --profile production \
  up -d --build
```

Caddy obtains and renews TLS certificates. Database migrations and static-file
collection run as health-gated one-shot services before Gunicorn starts. See
[`DEPLOYMENT.md`](DEPLOYMENT.md) for backup, health, upgrade, and rollback steps.

The production runbook includes an atomic, checksummed `pg_dump` script and a
daily systemd timer. A real restore drill remains mandatory; archive parsing is
only the fast per-backup integrity gate.

---

## 📁 Project Structure

```
FORKED-NUCES/
├── client/                        # Next.js 16 frontend and same-origin BFF
│   └── src/
│       ├── app/
│       │   ├── (auth)/            # Login, Register, Verify pages
│       │   ├── (platform)/        # Protected platform pages
│       │   ├── (public)/          # Landing page
│       │   └── api/               # Next.js proxy routes to Django
│       ├── components/            # Shared UI components
│       ├── hooks/                 # Custom React hooks
│       ├── lib/                   # Utilities and types
│       └── stores/                # Zustand state stores
│
├── server/                        # Django 5.2 Backend
│   ├── accounts/                  # Users, auth, email verification
│   ├── projects/                  # Projects, issues, collaborators
│   ├── interactions/              # Likes, comments
│   ├── notifications/             # In-app event notifications
│   ├── moderation/                # Reports and staff review queue
│   ├── drf_backend/               # Settings, root URLs, WSGI
│   └── gunicorn.conf.py           # Tunable production process settings
│
├── Caddyfile                      # Automatic HTTPS reverse proxy
├── DEPLOYMENT.md                  # Production operations runbook
├── ops/                            # Backup script and systemd timer
└── docker-compose.yml             # Health-gated production/local topology
```

---

## 🤝 Contributing

Contributions are welcome from FAST NUCES students and the wider community!

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push and open a Pull Request against `main`

> For significant changes, please open an issue first to discuss your idea.

---

## 👨‍💻 Team

Abdul Rafay Mughal · Abdullah Azhar Khan · Muhammad Awais

---

<div align="center">

**If this project helped you or inspired you, consider giving it a ⭐**

*Built with ❤️ for the FAST NUCES community*

</div>
