# LMS Backend (NestJS + MongoDB)

Step 1 backend foundation for your Udemy-style platform is implemented.

## Features in this milestone

- JWT authentication
- Two roles: `admin` and `student`
- Admin registration protected by setup key
- Common user auth flows: login, signup, change password, signout
- Admin can create, edit, and delete courses
- Courses support nested content: sections and subsections (with video URLs)
- Admin can allocate and unallocate courses for students
- Admin can create cohorts and share access via invite link/code or special key
- Student can list/access only allocated courses
- Student can join cohorts and automatically receive cohort course access
- Admin announcements can auto-send emails to all students (when SMTP is configured)
- IAM validation via JWT guard + role guard + DTO validation

## Tech stack

- NestJS 11
- MongoDB + Mongoose
- Passport JWT
- Class-validator + global validation

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Update `.env`

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_SETUP_KEY=adminacc`
- Optional SMTP for announcement email automation:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

4. Start server

```bash
npm run start:dev
```

Base URL: `http://localhost:3000/api`

## Announcement Email Automation

When admin posts an announcement (`POST /api/community/announcements`), backend:

1. saves announcement in MongoDB
2. fetches all student emails
3. sends one email per student via SMTP
4. returns delivery status to frontend

### SMTP env vars

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password
SMTP_FROM=your_from_email@example.com
```

### Announcement create response

```json
{
  "announcement": {
    "id": "announcement_id",
    "title": "Title",
    "message": "Message",
    "postedBy": {
      "id": "admin_id",
      "name": "Admin",
      "email": "admin@example.com"
    },
    "createdAt": "2026-03-20T12:00:00.000Z",
    "updatedAt": "2026-03-20T12:00:00.000Z"
  },
  "emailDelivery": {
    "enabled": true,
    "attempted": 20,
    "sent": 19,
    "failed": 1
  }
}
```

## API endpoints (phase 1)

### Auth

- `POST /api/auth/register/student`
- `POST /api/auth/register/admin`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `PATCH /api/auth/password` (Bearer token)
- `POST /api/auth/signout` (Bearer token)

### Courses (admin only)

- `POST /api/courses`
- `GET /api/courses`
- `GET /api/courses/:courseId`
- `PUT /api/courses/:courseId` (update metadata and sections/subsections/video URLs)
- `DELETE /api/courses/:courseId`

### Enrollments

- `POST /api/enrollments` (admin only, allocate course)
- `DELETE /api/enrollments/course/:courseId/student/:studentId` (admin only, unallocate course)
- `GET /api/enrollments/my-courses` (student only)
- `GET /api/enrollments/my-courses/:courseId` (student only)
- `GET /api/enrollments/course/:courseId/students` (admin only)

### Users (admin only)

- `GET /api/users/students`

### Cohorts

- `POST /api/cohorts` (admin)
- `GET /api/cohorts` (admin)
- `PATCH /api/cohorts/:cohortId` (admin)
- `POST /api/cohorts/:cohortId/rotate-key` (admin)
- `POST /api/cohorts/join/invite/:inviteCode` (student)
- `POST /api/cohorts/join/key` (student)
- `GET /api/cohorts/my` (student)

## Test and build

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```
