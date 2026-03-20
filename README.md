# LMS VRT (Frontend + Backend)

This repo now runs as a full-stack LMS starter with:

- Frontend: React + Vite (`/`)
- Backend: NestJS + MongoDB (`/backend`)
- Roles: `admin`, `student`
- Admin can create courses and allocate them to students
- Students can only view courses allocated to them

## 0) Quick start (run in browser locally)

Use 2 terminals so frontend and backend run together.

### Terminal 1 - backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=lms_vrt
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
ADMIN_SETUP_KEY=adminacc
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
# Optional: announcement email automation
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password
SMTP_FROM=your_from_email@example.com
```

Start backend:

```bash
npm run start:dev
```

### Terminal 2 - frontend

```bash
# from repo root
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
# optional, only for AI advisor
GEMINI_API_KEY=
```

Start frontend:

```bash
npm run dev
```

Open in browser: `http://localhost:5173`

If MongoDB is empty, signup first, then login.

## 1) MongoDB setup

You can use either local MongoDB or MongoDB Atlas.

### Option A: Local MongoDB

1. Install MongoDB Community Edition.
2. Start MongoDB service.
3. Use this URI in backend env:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/lms-vrt
MONGODB_DB=lms_vrt
```

### Option B: MongoDB Atlas

1. Create a cluster in Atlas.
2. Create database user + password.
3. Allow your IP (or temporary `0.0.0.0/0` for development only).
4. Copy connection string and use it in backend env:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB=lms_vrt
```

## 2) Backend setup (`/backend`)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `ADMIN_SETUP_KEY=adminacc`
- `CORS_ORIGIN=http://localhost:5173`
- Optional announcement email automation (SMTP):
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

Run backend:

```bash
npm run start:dev
```

Backend base URL: `http://localhost:3000/api`

## 3) Frontend setup (`/`)

```bash
# from repo root
npm install
cp .env.example .env.local
```

Set in `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
GEMINI_API_KEY=your_key_optional
```

Run frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## 4) Announcement Email Automation (Admin -> Students)

When an admin posts a new announcement, backend can automatically email all students.

### How it works

- Endpoint used: `POST /api/community/announcements`
- Backend saves the announcement in MongoDB first.
- Backend then queries all students and sends one email per student via SMTP.
- API response includes delivery status:
  - `sent` (success count)
  - `failed` (failure count)
  - `attempted` (total recipients)
  - `enabled` (whether SMTP config is active)
- Admin UI shows this immediately after posting (for example: `sent 24, failed 2`).

### Required SMTP env vars (`backend/.env`)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password
SMTP_FROM=your_from_email@example.com
```

### Provider note (Gmail)

- Use an App Password (not your normal Gmail password).
- Keep 2FA enabled on the Gmail account.

### Quick test

1. Configure SMTP values in `backend/.env`.
2. Restart backend (`npm run start:dev` in `backend`).
3. Login as admin and open Community.
4. Post an announcement.
5. Check success notice for email delivery status and confirm mailbox delivery.

## Common issues

- CORS error:
  Set `CORS_ORIGIN` in `backend/.env` to your frontend URL (for local: `http://localhost:5173`), then restart backend.
- Mongo connection/auth error:
  In MongoDB Atlas, verify DB user credentials and Network Access allowlist (for testing you can add `0.0.0.0/0`).
- Login fails on fresh DB:
  Create account using signup first, then login.
- Frontend cannot call backend:
  Ensure `.env.local` has `VITE_API_BASE_URL=http://localhost:3000/api` and restart Vite.

### Frontend routes (SPA)

- `/auth` - login/register screen
- `/signup` - direct signup screen (defaults to student signup)
- `/` - dashboard
- `/courses/:courseId` - course details
- `/community` - community page
- `/profile` - profile page
- `/admin` - admin-only panel
- `/ai-advisor` - student-only AI advisor

## 5) How to use the website

### First-time admin setup

1. Open frontend (`http://localhost:5173`).
2. Open `/signup`, then choose `Signup Admin` tab.
3. Register admin with name, email, password, and `Admin Setup Key` = `adminacc`.
4. You are logged in automatically.

### Create courses (admin)

1. Go to `Admin` tab.
2. In `Create Course`, enter title, description, optional thumbnail URL, price.
3. Submit.

### Add course content (admin)

1. In `Admin`, open `Edit Course Content`.
2. Select a course.
3. Add sections.
4. Add subsections under each section and provide a `videoUrl` for each subsection.
5. Save course content.

### Create student account

1. Log out, or open another browser/private tab.
2. Open `/signup` (or choose `Signup Student` tab on `/auth`).
3. Register student (name/email/password).
4. Log out student.

### Allocate course to student (admin)

1. Log back in as admin.
2. Go to `Admin` tab.
3. In `Allocate Course`, choose course + student.
4. Submit.

### Student access

1. Log in as student.
2. Dashboard shows only allocated courses.
3. Open a course to read/access details.

## 6) API summary

- Auth
  - `POST /api/auth/register/student`
  - `POST /api/auth/register/admin`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `PATCH /api/auth/password`
  - `POST /api/auth/signout`
- Admin
  - `GET /api/users/students`
  - `POST /api/courses`
  - `GET /api/courses`
  - `GET /api/courses/:courseId`
  - `PUT /api/courses/:courseId` (edit course metadata + sections/subsections/video URLs)
  - `DELETE /api/courses/:courseId`
  - `POST /api/enrollments`
  - `DELETE /api/enrollments/course/:courseId/student/:studentId`
  - `GET /api/enrollments/course/:courseId/students`
- Student
  - `GET /api/enrollments/my-courses`
  - `GET /api/enrollments/my-courses/:courseId`
- Community
  - `GET /api/community/announcements`
  - `POST /api/community/announcements` (admin, returns announcement + email delivery status)
  - `POST /api/community/messages` (student -> admin)
  - `GET /api/community/messages/my` (student sent messages)
  - `GET /api/community/messages` (admin inbox)
