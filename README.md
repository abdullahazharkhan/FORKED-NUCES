# FORKED NUCES

A student-driven collaboration platform designed exclusively for **FAST-NUCES (National University of Computer and Emerging Sciences)** students. It enables students to share their projects, discover collaborative opportunities, and practice open-source contribution workflows within their university community.

## 🎯 Purpose

- Help students finish their projects by connecting them with peers who can solve complex features
- Facilitate open-source collaboration within the FAST community
- Build developer portfolios through project contributions
- Enable cross-batch collaboration and team building for competitions/hackathons

## 🛠️ Tech Stack

### Frontend (Client)

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **HeroUI** | UI component library |
| **TanStack React Query** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form handling & validation |
| **Framer Motion** | Animations |
| **md-editor-rt** | Markdown editor/preview |
| **Lucide React** | Icons |

### Backend (Server)

| Technology | Purpose |
|------------|---------|
| **Django 5.2+** | Web framework |
| **Django REST Framework** | REST API |
| **PostgreSQL** | Database |
| **SimpleJWT** | JWT authentication with token blacklist |
| **django-cors-headers** | CORS handling |

## ✨ Features

### 1. Authentication System
- User registration with NU email validation (only `@nu.edu.pk` emails allowed)
- Email verification with secure tokens (24-hour expiry)
- JWT-based authentication (15-min access token, 7-day refresh token)
- Login/Logout with token blacklisting
- Protected routes via Next.js middleware
- Automatic redirect from auth pages if already logged in

### 2. User Management
- Profile management with full name, bio, GitHub username, and avatar
- Skills system - users can add/manage their technical skills
- User search functionality
- Activity statistics - track projects created, issues collaborated, comments made
- Auto-generated avatars for new users

### 3. Project Management
- Create, edit, and delete projects with GitHub URL integration
- Tag system - categorize projects with technology tags
- Project search with text search and tag filtering
- Markdown description support with live preview
- Owner-only edit/delete permissions

### 4. Issue Tracking
- Create issues on projects (open by default)
- Issue statuses: Open/Closed
- Edit/Delete issues (project owner only)
- Close issues with collaborators - track who helped solve issues
- Markdown descriptions for issues

### 5. Social Interactions
- Like/Unlike projects (toggle functionality)
- Comment system on projects
- Delete comments (author or project owner)
- Engagement metrics - likes count, comments count displayed

### 6. Collaboration Features
- Collaborator tracking - when closing issues, add users who helped
- View collaborators per project
- Track collaborated projects per user
- Cross-project collaboration history

### 7. Recommendation System
- **Spotlight/Trending Projects** - based on engagement + recency
- **Projects Needing Help** - projects with open issues
- **Skill-Matched Projects** - match user skills to project tags
- **Network Projects** - projects user has interacted with
- **Top Contributors** - ranked by activity score
- **Recent Activity Feed** - latest platform actions

## 🔌 API Endpoints

### Authentication (`/api/accounts/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Register new user |
| POST | `/verify-email/` | Verify email with token |
| POST | `/resend-verification-email/` | Resend verification email |
| POST | `/login/` | Login and get JWT tokens |
| POST | `/logout/` | Logout and blacklist refresh token |
| GET | `/me/` | Get current user profile |
| PATCH | `/me/` | Update user profile |
| GET | `/users/` | List all users (except self) |
| GET | `/users/<id>/` | Get user details |
| GET | `/users/search/` | Search users by email |

### Projects (`/api/projects/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's projects |
| POST | `/` | Create project |
| GET | `/all/` | List all projects |
| GET | `/<id>/` | Get project (owner view) |
| PUT/PATCH | `/<id>/` | Update project |
| DELETE | `/<id>/` | Delete project |
| GET | `/view/<id>/` | Get project (public view) |
| GET | `/user/<id>/` | List user's projects |
| POST | `/<id>/issues/` | Create issue |
| PUT/PATCH | `/<id>/issues/<issue_id>/` | Update issue |
| DELETE | `/<id>/issues/<issue_id>/` | Delete issue |
| PUT | `/<id>/issues/<issue_id>/status/` | Update issue status |
| POST | `/<id>/issues/<issue_id>/close/` | Close issue with collaborators |
| GET | `/<id>/collaborators/` | Get project collaborators |
| GET | `/collaborated/<user_id>/` | Get user's collaborated projects |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommended/?mode=spotlight` | Trending projects |
| GET | `/recommended/?mode=needs-help` | Projects needing help |
| GET | `/recommended/?mode=skill-match` | Skill-matched projects |
| GET | `/recommended/?mode=network` | User's network projects |
| GET | `/top-contributors/` | Top contributors leaderboard |
| GET | `/activity/me/` | Current user's activity stats |
| GET | `/activity/<user_id>/` | Specific user's activity stats |
| GET | `/recent-activity/` | Recent platform activity |

### Interactions (`/api/interactions/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/comments/` | Create comment |
| DELETE | `/comments/<id>/` | Delete comment |
| GET | `/comments/project/<id>/` | Get project comments |
| POST | `/likes/toggle/` | Toggle project like |

### JWT Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/token/` | Obtain JWT token pair |
| POST | `/api/token/refresh/` | Refresh access token |

## 🗄️ Database Schema

### Core Tables

#### Users & Authentication
- **accounts_user** - User accounts with NU email domain validation
- **accounts_skill** - User skills (many-to-one with user)
- **accounts_verificationtoken** - Email verification tokens with expiry

#### Projects
- **projects_project** - Projects with title, description, GitHub URL
- **projects_tag** - Project tags for categorization
- **projects_issue** - Issues with open/closed status
- **projects_collaborator** - Links users to issues they helped resolve

#### Interactions
- **interactions_comment** - Comments on projects
- **interactions_like** - Project likes (unique per user-project)

### Entity Relationships

```
User (1) ────> (N) Skill
User (1) ────> (N) VerificationToken
User (1) ────> (N) Project (as owner)
User (1) ────> (N) Comment
User (1) ────> (N) Like
User (N) <───> (N) Issue [via Collaborator]

Project (1) ────> (N) Tag
Project (1) ────> (N) Issue
Project (1) ────> (N) Comment
Project (1) ────> (N) Like

Issue (1) ────> (N) Collaborator
```

## 📊 Database Views

| View | Purpose |
|------|---------|
| `project_summary_view` | Projects with aggregated stats (likes, comments, issues, engagement score) |
| `user_activity_view` | Users with activity metrics and activity score |
| `trending_projects_view` | Projects ranked by trending score (engagement × recency) |
| `projects_needing_help_view` | Projects with open issues |
| `project_tags_flat_view` | Flattened project-tag relationships for skill matching |
| `top_contributors_view` | Users ranked by activity score with RANK() |
| `recent_activity_view` | Platform activity feed (projects, comments, issue resolutions) |

## ⚡ Database Triggers

| Trigger | Event | Action |
|---------|-------|--------|
| `trg_tag_update_project_timestamp` | Tag changes | Updates project's `updated_at` |
| `trg_issue_update_project_timestamp` | Issue changes | Updates project's `updated_at` |
| `trg_like_update_project_timestamp` | Like changes | Updates project's `updated_at` |
| `trg_comment_update_project_timestamp` | Comment changes | Updates project's `updated_at` |
| `trg_skill_update_user_timestamp` | Skill changes | Updates user's `updated_at` |
| `trg_audit_project_changes` | Project changes | Logs to `audit_project_log` |
| `prevent_self_like` | Like insert | Prevents users from liking own projects |

## 🔐 Security Features

- **NU Email Domain Validation** - Only `@nu.edu.pk` emails accepted
- **Email Verification Required** - Tokens expire after 24 hours
- **JWT Authentication** - Short-lived access tokens (15 min)
- **Token Blacklisting** - Invalidate tokens on logout
- **HTTP-Only Cookies** - Secure token storage
- **Route Protection** - Middleware protects platform routes
- **Permission Checks** - Owner-only edit/delete operations
- **CORS Configuration** - Restricted origins

## 🔄 Transaction Support

The application uses atomic database transactions for:
- **User Registration** - Create user + skills + verification token
- **Project Creation** - Create project + tags
- **Project Update** - Update project + replace tags
- **Issue Closure** - Close issue + add collaborators
- **Like Toggle** - Check + create/delete like atomically

## 📁 Project Structure

```
forked-nuces/
├── client/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Auth pages (login, register, verify)
│   │   │   ├── (platform)/   # Protected platform pages
│   │   │   ├── (public)/     # Public landing page
│   │   │   └── api/          # Next.js API routes (proxy to Django)
│   │   ├── components/       # Shared components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (authClient, authFetch, types)
│   │   └── stores/           # Zustand state stores
│   └── package.json
│
├── server/                    # Django Backend
│   ├── accounts/             # User authentication & profiles
│   ├── projects/             # Projects, issues, collaborators
│   ├── interactions/         # Comments, likes
│   ├── drf_backend/          # Django settings & root URLs
│   ├── sql/                  # SQL scripts (schema, views, triggers)
│   └── requirements.txt
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (create `.env` file):
   ```
   SECRET_KEY=your-secret-key
   DEBUG=True
   DATABASE_URL=postgres://user:password@localhost:5432/forked_nuces
   EMAIL_HOST=smtp.your-email-provider.com
   EMAIL_HOST_USER=your-email@example.com
   EMAIL_HOST_PASSWORD=your-email-password
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. (Optional) Load SQL scripts for views and triggers:
   ```bash
   psql -U your_user -d forked_nuces -f sql/views.sql
   psql -U your_user -d forked_nuces -f sql/triggers.sql
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create `.env.local` file):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
