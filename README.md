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
   - Infrastructure & Observability
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
It is architected with production best practices including request validation, centralized error handling, RBAC, scalable folder structure, token rotation, structured logging, and optimized API response patterns.

---

# 2. Features

## Authentication & Security
- **JWT Token Rotation**: Access + Refresh token model. Refresh tokens are hashed and stored in a dedicated `RefreshToken` collection with an automatic 7-day TTL, and returned via HTTP-only cookies.
- **Robust 2FA**: Email-based OTP during login and signup. OTPs are securely hashed and stored in a short-lived, auto-expiring `Otp` collection to prevent database bloat.
- **Rate Limiting**: IP-based rate limiting configured for production environments behind proxies (`trust proxy`).
- **Secure Password Reset**: Secure short-lived tokens sent via email.
- **Request Validation**: Zod-powered schema validation for all incoming payloads.
- **Encrypted File Uploads**: Cloudinary integration for secure resume hosting.

## Infrastructure & Observability
- **Graceful Shutdown**: Properly intercepts `SIGINT` and `SIGTERM` signals to close the HTTP server and gracefully terminate the MongoDB connection, preventing data corruption and dropped requests.
- **Structured Logging**: Integrated `pino` and `pino-http` for performant, JSON-structured application and request logging, removing reliance on basic `console.log`.
- **Deep Health Checks**: A detailed `/api/health` endpoint providing runtime liveness visibility. It includes active MongoDB ping validation, system memory usage (V8 heap, total/free RAM), CPU load averages, and process uptime.

## Database & Performance Optimization
- **Lean Mongoose Queries**: Heavy read operations employ Mongoose's `.lean()` method and strategic field projections to minimize memory overhead and serialization costs.
- **TTL Collections**: Utilizes MongoDB's Time-To-Live indexes for `Otp`, `PendingUser`, `PasswordResetToken`, and `RefreshToken` collections to automatically purge expired records.

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
- Pino (Logging)
- Cookie-Parser

---

# 4. System Architecture

### High-level Architecture
```text
Client (React)
    |
    |— Auth + API Calls via fetch/axios (credentials included)
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
- All heavy reads return POJOs via Mongoose `.lean()`.

---

# 5. Folder Structure

### Backend
```text
backend/
│── src/
│   ├── config/        # Database and external integrations
│   ├── controllers/   # Request handlers and business logic
│   ├── middlewares/   # Auth, roles, logging, rate limiters
│   ├── models/        # Mongoose schemas (User, RefreshToken, Otp, etc.)
│   ├── routes/        # Express routers
│   ├── utils/         # Helper functions (tokens, logger, email)
│   ├── zodSchema/     # Zod validation schemas
│   └── app.js
│
└── server.js          # App entry point + Graceful Shutdown
```

### Frontend
```text
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

```env
PORT=
JWT_SECRET_KEY=
MONGO_URI= 
EMAIL_USER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=      
CLOUDINARY_API_SECRET=
FRONTEND_URL=
RESEND_API_KEY=
```

---

## Authentication Flow

1. User logs in.  
2. System verifies password.  
3. System sends a 2FA OTP email and stores a hashed OTP in the `Otp` collection.  
4. User verifies OTP.  
5. Access token (short-lived) and Refresh token (long-lived) are generated.  
6. Refresh token is hashed and saved in `RefreshToken` and sent back as a strictly secure HTTP-only cookie.
7. Access token is returned in the JSON payload, and the Client stores the JWT in Zustand (memory only).  
8. `/api/auth/refresh` endpoint renews active Access Tokens seamlessly via the cookie.

---

## Infrastructure & Observability

### Graceful Shutdown
The server listens for `SIGINT` and `SIGTERM`. Upon receiving termination signals, the Express HTTP server stops accepting new requests, actively processing requests finish, and finally, the MongoDB connection is closed securely before exiting the Node process.

### Structured Logging
Console logs are replaced by Pino. All incoming HTTP requests, response times, and application events are logged in a structured JSON format to assist with querying in production observability tools. Development mode utilizes `pino-pretty` for human-readable output.

### Deep Health Probes
The `/api/health` unauthenticated route actively queries the MongoDB connection (`mongoose.connection.db.admin().ping()`), reads host OS telemetry (CPU load, free memory), and measures internal process heap layout to ensure the application is truly responsive rather than just "running".

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
- `authentication`  
- `requireRole([roles])`  
- `requireCompanyRole([roles])`  

---

## API Endpoints

### Auth
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-signup-2fa
POST /api/auth/enable-2fa
POST /api/auth/verify-2fa
POST /api/auth/disable-2fa
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token/:id
GET  /api/auth/me
PATCH /api/auth/me
PATCH /api/auth/update-role
```

### System
```text
GET /api/health
```

### Profiles
```text
GET /api/profile/me
PUT /api/profile/update
POST /api/profile/upload-resume
```

### Companies
```text
POST /api/company/create
POST /api/company/join/:id
POST /api/company/requests/:id/respond
GET  /api/company/my-company
```

### Jobs
```text
POST   /api/job
PUT    /api/job/:id
DELETE /api/job/:id
GET    /api/job
GET    /api/job/:id
POST   /api/job/:id/apply
PUT    /api/job/applications/:id/status
```

### Articles
```text
POST   /api/article
GET    /api/article
GET    /api/article/:id
PUT    /api/article/:id
DELETE /api/article/:id
```

### Connections
```text
POST /api/connection/send/:userId
POST /api/connection/respond/:requestId
GET  /api/connection
```

---

# 7. Frontend Documentation

## Auth Flow (React + Zustand)

- Login/signup → backend  
- After success, `/api/auth/me` is fetched  
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
```env
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
```bash
npm install
npm run dev
npm run build
```

### Frontend
```bash
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
