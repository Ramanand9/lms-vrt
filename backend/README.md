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
- Student can list/access only allocated courses
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

4. Start server

```bash
npm run start:dev
```

Base URL: `http://localhost:3000/api`

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

## Test and build

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```
