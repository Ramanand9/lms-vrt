# LMS VRT (Frontend + Backend)

This repo now runs as a full-stack LMS starter with:

- Frontend: React + Vite (`/`)
- Backend: NestJS + MongoDB (`/backend`)
- Roles: `admin`, `student`
- Admin can create courses and allocate them to students
- Students can only view courses allocated to them

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

Run backend:

```bash
npm run start:dev
```

Backend base URL: `http://localhost:3000/api`

## 3) Frontend setup (`/`)

```bash
cd ..
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

### Frontend routes (SPA)

- `/auth` - login/register screen
- `/signup` - direct signup screen (defaults to student signup)
- `/` - dashboard
- `/courses/:courseId` - course details
- `/community` - community page
- `/profile` - profile page
- `/admin` - admin-only panel
- `/ai-advisor` - student-only AI advisor

## 4) How to use the website

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

## 5) API summary

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
