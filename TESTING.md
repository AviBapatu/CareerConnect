# CareerConnect Backend Testing Suite

This document provides a comprehensive overview of the testing infrastructure, mocking strategies, and factories implemented to ensure the reliability, security, and correctness of the CareerConnect MERN platform.

---

## 1. Architecture Overview
The CareerConnect backend testing suite is built using **Jest** and **Supertest** to execute integration tests against an Express application running on an isolated test database.
- **Isolated State**: The database is cleared before each test runs to guarantee zero-contamination.
- **No Listen Ports**: The Express server is exported without listening on ports, avoiding socket collisions.
- **Stubbed Transactions**: Database operations using sessions and transactions are intercepted to support standalone MongoDB development instances without needing active replica sets.

---

## 2. Folder Structure
All testing infrastructure files are organized inside the `backend/` directory:

```text
backend/
├── jest.config.js       # Jest ESM configuration
├── test/
│   ├── setup.js         # Environment vars, global mocks, DB connection, and transactions hook
│   ├── teardown.js      # Global cleanup hook
│   ├── helpers.js       # JWT generators, auth headers, and DB cleanup helpers
│   └── factories.js     # DB entity factory methods (Candidate, Recruiter, Admin, Company, etc.)
└── __tests__/
    ├── auth.test.js     # User registration, login (incl. 2FA/OTP), refresh tokens, and logout
    ├── rbac.test.js     # App-level roles validation (Candidate vs. Recruiter vs. Admin)
    ├── companyRbac.test.js  # Company-specific membership validation (Admin vs. Recruiter vs. Employee)
    ├── workflows.test.js    # Multi-step job applications, joining companies, and connection workflows
    └── security.test.js # Zod validation schema checks and JWT signature/expiration tests
```

---

## 3. How To Run Tests

From the `backend/` directory, execute:

### Run All Tests
```bash
npm test
```

### Run with Coverage Report
```bash
npm run test:coverage
```

---

## 4. Mocking Strategy
External integrations are mocked globally in [setup.js](file:///d:/CareerConnect-3/backend/test/setup.js):
- **Email Delivery (Brevo / sib-api-v3-sdk)**: Mocked transaction delivery to instantly resolve requests successfully without making HTTP requests.
- **Resend SDK**: Mapped to stub methods returning success IDs.
- **Cloudinary**: Intercepted to return mock URLs and public IDs.
- **MongoDB Transactions**: Session transaction lifecycle methods (`startTransaction`, `commitTransaction`, `abortTransaction`) are stubbed at runtime.

---

## 5. Factories Usage
Factories in [factories.js](file:///d:/CareerConnect-3/backend/test/factories.js) use `@faker-js/faker` to dynamically generate database documents. Pass custom attributes to override defaults.

```javascript
import { createCandidate, createCompany, createCompanyRecruiter, createJob } from "../test/factories.js";

// Example Usage
const company = await createCompany();
const recruiter = await createCompanyRecruiter(company, { name: "Special Recruiter" });
const candidate = await createCandidate({ email: "target@example.com" });
const job = await createJob(company, recruiter, { title: "Software Engineer" });
```

---

## 6. Authentication Tests
Located in `auth.test.js`, this suite covers:
- Complete registration flow with verification email OTP checks.
- Password hashing comparison and login rejection reasons.
- 2FA/OTP code request and validations.
- Refresh token rotation (automatic revocation of old tokens and new token issuing).

---

## 7. RBAC Tests
Located in `rbac.test.js` & `companyRbac.test.js`, these suites verify:
- **Application Level**: Candidates cannot post, edit, or delete jobs, nor access recruiter dashboards.
- **Company Level**: Company Admins can edit profile information, promote employees, and remove members. Company Recruiter role permissions are restricted. Company Employees cannot administrative actions.

---

## 8. Workflow Tests
Located in `workflows.test.js`, this file evaluates complex business flows:
1. **Job Application Workflow**: Recruiter posts a job -> Candidate searches and applies -> Recruiter reviews the application and updates its status -> Verify state persistence.
2. **Company Lifecycle**: Recruiter requests to join a company -> Company Admin approves the request -> Recruiter profile is updated with the company reference.
3. **Connections**: Users send requests, accept connections, prevent duplicates, and block self-requests.
4. **Articles**: Permissions for update, delete, and moderator deletions.

---

## 9. Security Tests
Located in `security.test.js`, this suite tests boundaries:
- Malformed inputs, invalid roles, and bad email/password formats return `400 Bad Request` with Zod structure messages.
- Tampered or expired JWT tokens return `401 Unauthorized`.

---

## 10. Coverage Report
By aiming tests at critical route handlers, middleware, and logic controllers, the suite yields a high test coverage across core application code:
- **Controllers Coverage**: >70%
- **Middlewares Coverage**: >85%
- **Models Coverage**: 100%
- **Routes Coverage**: >90%
