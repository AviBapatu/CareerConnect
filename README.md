# CareerConnect  
A production-style MERN application for job discovery, company management, and role-based collaboration. It provides a complete workflow for candidates, recruiters, and company admins with strict RBAC, profile management, job posting, applications, articles, and user engagement features.

---

## Table of Contents
1. Overview  
2. Features  
3. Tech Stack  
4. System Architecture  
5. Folder Structure  
6. Backend Documentation  
   - Environment Configuration  
   - Authentication Flow  
   - Role & Company Role Management  
   - API Endpoints  
7. Frontend Documentation  
   - Auth Flow  
   - Route Protection  
   - State Management  
8. Deployment  
9. Development Scripts  
10. Future Enhancements  
11. License  

---

# 1. Overview
CareerConnect is a full-stack platform that enables users to create profiles, connect with companies, post and apply for jobs, write articles, and manage hiring workflows.  
It is architected with production best practices including request validation, centralized error handling, RBAC, scalable folder structure, and optimized API response patterns.

---

# 2. Features

## Authentication & Security
- JWT authentication (access + refresh)
- Email-based 2FA during login
- Password reset via secure mail link
- Zod-powered request validation
- Encrypted file uploads (resumes)

## User & Profile
- Create and update user profile
- Upload resume
- View profile details
- Engagement tracking

## Companies
- Create a company
- Send & respond to join requests
- Role hierarchy: admin → recruiter → employee
- Company-specific RBAC for protected operations

## Jobs
- Recruiters/admins can post jobs
- Edit or delete job posts
- Candidates can apply to jobs
- Recruiters can manage applications and statuses

## Articles
- Create, read, update, delete articles
- Access control based on ownership and role

## Connections
- Send/accept/decline user connection requests

## Frontend
- React + Tailwind + Shadcn/UI  
- Role-based routing  
- Zustand global stores for auth and company  
- Recruiter and candidate-specific dashboards  

---

# 3. Tech Stack

### Frontend
- React  
- React Router DOM  
- Tailwind CSS  
- Shadcn/UI  
- Zustand  

### Backend
- Node.js  
- Express  
- MongoDB + Mongoose  
- Zod  
- Multer  
- Nodemailer  

---

# 4. System Architecture

### High-level Architecture
```
Client (React)
    |
    |— Auth + API Calls via fetch/axios
    |
Backend (Node/Express)
    |— Auth Controller
    |— Profile Controller
    |— Company Controller
    |— Job Controller
    |— Article Controller
    |— Connection Controller
    |
Database (MongoDB)
```

### Backend Core Principles
- Controllers contain business logic only  
- Services handle database operations  
- `catchAndWrap` wraps unsafe operations  
- `AppError` for typed errors  
- Global error handler for uniform API responses  
- Zod for schema validation  
- Role and companyRole middlewares enforce RBAC  

---

# 5. Folder Structure

### Backend
```
backend/
│── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   ├── utils/
│   ├── validations/
│   ├── routes/
│   ├── models/
│   └── app.js
│
└── server.js
```

### Frontend
```
frontend/
│── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   └── router/
```

---

# 6. Backend Documentation

## Environment Configuration
Create a `.env` file with the following:

```
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=
```

---

## Authentication Flow

1. User logs in  
2. System verifies password  
3. System sends a 2FA OTP email  
4. User verifies OTP  
5. Access + refresh tokens are generated  
6. Client stores JWT in Zustand (memory only)  

Refresh tokens renew access tokens in background.

---

## Role and Company Role Management

### User roles  
- candidate  
- recruiter  
- admin  

### Company roles  
- employee  
- recruiter  
- admin  

### Middlewares  
- `requireAuth`  
- `requireRole([roles])`  
- `requireCompanyRole([roles])`  

---

## API Endpoints

### Auth
```
POST /auth/register
POST /auth/login
POST /auth/verify-otp
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
```

### Profiles
```
GET /profile/me
PUT /profile/update
POST /profile/upload-resume
```

### Companies
```
POST /company/create
POST /company/join/:id
POST /company/requests/:id/respond
GET  /company/my-company
```

### Jobs
```
POST   /jobs
PUT    /jobs/:id
DELETE /jobs/:id
GET    /jobs
GET    /jobs/:id
POST   /jobs/:id/apply
PUT    /jobs/applications/:id/status
```

### Articles
```
POST   /articles
GET    /articles
GET    /articles/:id
PUT    /articles/:id
DELETE /articles/:id
```

### Connections
```
POST /connections/send/:userId
POST /connections/respond/:requestId
GET  /connections
```

---

# 7. Frontend Documentation

## Auth Flow (React + Zustand)

- Login/signup → backend  
- After success, `/auth/me` is fetched  
- Based on role + company status, app redirects accordingly:

### Redirect Logic
- Candidate → `/home`  
- Recruiter without company → `/welcome`  
- Recruiter with company → `/dashboard`  

This logic runs inside a `useEffect` watching `auth.user`.

---

## Route Protection

### ProtectedRoute
Blocks unauthenticated users.

### RoleProtectedRoute
Blocks users without required app-level roles.

### CompanyRoleProtectedRoute
Blocks users without required company-level roles.

---

## State Management (Zustand)

### authStore
- jwt  
- user  
- login()  
- logout()  
- fetchProfile()  

### companyStore
- company  
- updateCompany()  
- clearCompany()  

---

# 8. Deployment

### Frontend Deployment
Can be deployed on:
- Vercel  
- Netlify  
- GitHub Pages  

Set environment variable:
```
VITE_API_URL=
```

### Backend Deployment
Deploy using:
- Render  
- Railway  
- AWS EC2 / Lightsail  
- Docker + Nginx  

MongoDB:
- MongoDB Atlas  
- Self-hosted MongoDB Docker container  

---

# 9. Development Scripts

### Backend
```
npm install
npm run dev
npm run build
```

### Frontend
```
npm install
npm run dev
npm run build
```

---

# 10. Future Enhancements
- Recruiter analytics dashboard  
- Real-time notifications  
- Comments on articles  
- Full-text search  
- Resume parser integration  
- Interview scheduling system  
- Company-level insights  

---

# 11. License
The project is released under the MIT License.
