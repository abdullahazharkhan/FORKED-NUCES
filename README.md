<div align="center">

# 🍴 FORKED NUCES

**The collaboration platform built for FAST NUCES students.**

Share your projects. Find contributors. Build together.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-forked--nuces.vercel.app-6C63FF?style=for-the-badge&logo=vercel)](https://forked-nuces.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

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

```
User's Browser (HTTPS)
        │
        ▼
┌──────────────────────────────────┐
│  Vercel CDN (Global Edge)        │
│  Next.js 15 · TypeScript         │
│  forked-nuces.vercel.app         │
└──────────┬───────────────────────┘
           │  REST API (JSON)
           ▼
┌──────────────────────────────────────────────────────┐
│  AWS EC2  ·  Ubuntu 22.04  ·  65.2.152.75            │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Docker Compose                                │  │
│  │                                                │  │
│  │  ┌────────────────────────────────────────┐    │  │
│  │  │  backend                               │    │  │
│  │  │  Python 3.12 · Django · Gunicorn       │    │  │
│  │  │  Port 8000 → internet                  │    │  │
│  │  └────────────────────────────────────────┘    │  │
│  │                                                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐    │  │
│  │  │  db              │  │  redis           │    │  │
│  │  │  PostgreSQL 16   │  │  Redis 7         │    │  │
        db and redis ports are internal only
│  │  │  (internal only) │  │  (internal only) │    │  │
│  │  └──────────────────┘  └──────────────────┘    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
           │
           ▼
   Gmail SMTP → forkednuces@gmail.com
```

---

## ✨ Highlights

| | |
|---|---|
| 🔐 **Verified Community** | Only `@nu.edu.pk` emails — no outsiders |
| 🤖 **Smart Recommendations** | 4-mode engine: trending, skill-match, needs-help, network |
| ⚡ **Redis Rate Limiting** | Shared throttling across all workers — accurate at scale |
| 🛡️ **Secure Auth** | JWT with rotating refresh tokens + blacklisting on logout |
| 🗄️ **PostgreSQL Views** | 7 custom DB views with aggregations and window functions |
| 🐳 **Fully Dockerised** | Reproducible 3-container stack on AWS EC2 |
| 📧 **Branded Emails** | HTML verification emails via Gmail SMTP |
| ⚛️ **Atomic Transactions** | All multi-step operations roll back on failure |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (TypeScript) | React framework with App Router |
| **Tailwind CSS + HeroUI** | Styling and UI components |
| **TanStack React Query** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form handling and validation |
| **Framer Motion** | Animations |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| **Django 5.2 + DRF** | REST API framework |
| **PostgreSQL 16** | Relational database with custom views and triggers |
| **Redis 7** | Rate limiting store + cache backend |
| **Gunicorn** | Production WSGI server |
| **Docker + Docker Compose** | 3-container stack (backend, db, redis) |
| **AWS EC2 t2.micro** | Cloud compute hosting |
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

### 👤 User Profiles
- Profile: name, bio, GitHub username, avatar
- Skill tagging — list your technologies
- User search by NU email
- Activity stats: projects created, issues collaborated on, comments made

### 📂 Projects
- Create / edit / delete projects with Markdown descriptions and GitHub URL
- Technology tag system for categorisation
- Text search + tag filtering
- Owner-only edit and delete permissions

### 🐛 Issue Tracking
- Create issues on any project (Open by default)
- Close issues and record who helped — **collaborators are tracked**
- Markdown support for issue descriptions

### 💬 Social
- Like / Unlike projects *(one like per user per project, enforced at DB level)*
- Comment on projects
- Delete comments *(author or project owner only)*

### 🤖 Recommendation Engine
| Mode | What it shows |
|---|---|
| `spotlight` | Trending projects by engagement × recency |
| `with-issues` | Projects needing contributors (most open issues) |
| `skill-match` | Projects whose tags match your skills |
| `network` | Projects from users you've collaborated with |

---

## 🔌 API Endpoints

> **Base URL:** `http://65.2.152.75:8000`

### Auth — `/api/auth/`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register/` | ❌ | Register new user |
| POST | `/verify-email/` | ❌ | Verify email with token |
| POST | `/resend-verification-email/` | ❌ | Re-send verification email |
| POST | `/login/` | ❌ | Login — returns JWT tokens |
| POST | `/logout/` | ✅ | Logout — blacklists refresh token |
| GET | `/me/` | ✅ | Get current user's profile |
| PATCH | `/me/update/` | ✅ | Update profile / skills |
| GET | `/users/` | ✅ | List all users (excluding self) |
| GET | `/users/<id>/` | ✅ | Get a specific user |
| GET | `/users/search/` | ✅ | Search users by NU email |
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
| `interactions_comment` | Comments on projects |
| `interactions_like` | Likes (unique per user + project) |

### PostgreSQL Views
7 custom views power the recommendation engine and leaderboards — avoiding N+1 query problems by doing heavy aggregation inside PostgreSQL:

| View | Purpose |
|---|---|
| `project_summary_view` | Likes, comments, open/closed issues, engagement score per project |
| `trending_projects_view` | Projects ranked by trending score (engagement × recency) |
| `projects_needing_help_view` | Projects with the most open issues |
| `project_tags_flat_view` | Flattened tags for skill-matching queries |
| `top_contributors_view` | Users ranked by activity score via SQL `RANK()` |
| `user_activity_view` | Per-user contribution stats |
| `recent_activity_view` | `UNION ALL` of recent projects + comments, sorted by date |

### Database Function
| Function | Purpose |
|---|---|
| `get_user_network_projects(user_id)` | Finds projects from nearby collaborators and users with similar liked projects for network recommendations |

> Self-likes are blocked in the API layer before a `Like` record is created.
---

## 🔐 Security

- **NU email enforcement** — validated at both model and serializer level
- **Email verification** — 24-hour expiry, tokens cannot be reused (`used_at` tracked)
- **Rotating JWT tokens** — old refresh tokens blacklisted on every refresh
- **HTTP-only cookies** — tokens not accessible to browser JavaScript
- **Redis rate limiting** — 30 req/min (anonymous), 200 req/min (authenticated), shared across all Gunicorn workers
- **Owner-only mutations** — edit/delete enforced in every view
- **CORS** — only `https://forked-nuces.vercel.app` is whitelisted
- **`DEBUG=False` in production** — no stack traces exposed
- **Atomic transactions** — registration, project creation, issue closure, likes all roll back on failure

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (running locally)
- Redis *(optional — throttling degrades gracefully without it)*

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

# PostgreSQL views/functions are created by Django migration 0007_db_views.py.

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
npm install

# Set up environment variables
cp .env.example .env.local
# Open .env.local — defaults should work for local dev

# Start the development server
npm run dev
# → App available at http://localhost:3000
```

> **Email in local dev:** Set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in your `.env` — verification emails will print to the terminal instead of being sent.

---

## ⚙️ Environment Variables

Both `.env.example` files are included in the repo. Copy them and fill in your own values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

**Backend variables** (`server/.env.example`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key — generate with the command in `.env.example` |
| `DEBUG` | `True` locally, `False` in production |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection details |
| `ALLOWED_HOSTS` | Comma-separated domains/IPs |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s) allowed to call the API |
| `FRONTEND_BASE_URL` | Used to build email verification links |
| `EMAIL_BACKEND` | Use `console.EmailBackend` locally to print emails to terminal |
| `EMAIL_HOST_USER` | Gmail address for sending emails |
| `EMAIL_HOST_PASSWORD` | Gmail App Password (generate in Google Account settings) |

**Frontend variables** (`client/.env.example`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE` | API URL used by the browser (client-side) |
| `DRF_API_BASE_URL` | API URL used by Next.js server-side proxy routes |

---

## 📁 Project Structure

```
FORKED-NUCES/
├── client/                        # Next.js 15 Frontend
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
│   ├── drf_backend/               # Settings, root URLs, WSGI
│   └── projects/migrations/0007_db_views.py # PostgreSQL views/function
│
└── docker-compose.yml             # 3-container production stack
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
