# LendFlow: Loan Management System

A lending platform where borrowers apply for personal loans and internal executives move those loans through their lifecycle.

- **Borrower portal**: sign up, personal details with a server-side eligibility check (BRE), salary slip upload, loan configuration with a live repayment calculator, and a loan status page.
- **Operations dashboard**: Sales, Sanction, Disbursement and Collection modules, each restricted to its role. Admin sees all four.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS · Node.js + Express 5 + TypeScript · MongoDB + Mongoose · JWT + bcrypt · Zod

## Running locally

Requirements: Node.js 20+ and MongoDB 6+ running locally (or a MongoDB Atlas URI).

```bash
# 1. API
cd server
cp .env.example .env          # set MONGO_URI and JWT_SECRET
npm install
npm run seed                  # creates one account per role
npm run dev                   # http://localhost:4000

# 2. Web app (new terminal)
cd client
cp .env.example .env.local    # JWT_SECRET must match the server's
npm install
npm run dev                   # http://localhost:3000
```

The web app proxies `/api/*` to the API (see `client/next.config.ts`), so the browser only talks to one origin and the auth cookie works without CORS.

## Test accounts

Created by `npm run seed` (password can be changed with `SEED_PASSWORD`):

| Role         | Email                 | Password     |
| ------------ | --------------------- | ------------ |
| Admin        | admin@lms.test        | Password@123 |
| Sales        | sales@lms.test        | Password@123 |
| Sanction     | sanction@lms.test     | Password@123 |
| Disbursement | disbursement@lms.test | Password@123 |
| Collection   | collection@lms.test   | Password@123 |
| Borrower     | borrower@lms.test     | Password@123 |

New borrowers can also sign up from `/signup`.

## Loan lifecycle

```
APPLIED ──(Sanction: approve)──> SANCTIONED ──(Disbursement: disburse)──> DISBURSED ──(auto, fully paid)──> CLOSED
   └──────(Sanction: reject + reason)──> REJECTED
```

Transitions live in `server/src/domain/loanStatus.ts`. Each one is a single conditional update (`findOneAndUpdate({ _id, status: from })`), so a loan can't be approved twice or disbursed before it is sanctioned, even with concurrent requests. Invalid transitions return `409 Conflict`.

A borrower can have only one open loan (APPLIED, SANCTIONED or DISBURSED) at a time. This is enforced by a partial unique index on `loans(borrower)` where `isOpen: true`. Once a loan is CLOSED or REJECTED they can apply again.

## Design decisions

**Business Rule Engine.** The BRE (`server/src/domain/bre.ts`) runs on the server, which is the only place it can be trusted; a client check can be bypassed by calling the API directly. It returns every failed rule, not just the first, so the user sees all reasons at once. It runs on profile submission and again at loan application, since age can change in between. The client only does format validation (PAN pattern, required fields) for quick feedback.

| Rule       | Rejects when                         |
| ---------- | ------------------------------------ |
| Age        | Not between 23 and 50 (inclusive)    |
| Salary     | Below ₹25,000 per month              |
| PAN        | Doesn't match `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| Employment | Unemployed                           |

PAN format: 5 letters, 4 digits, 1 letter. Input is upper-cased before validation.

**Loan math.** Simple interest, `SI = (P × R × T) / (365 × 100)` with T in days and R = 12. All money is stored and sent as **integer paise** to avoid floating point errors (e.g. ₹50,000 for 30 days gives SI = 49,315 paise = ₹493.15). The client mirrors the formula for the live preview, but the server recomputes everything on apply and ignores any client totals.

**Payments.** Each payment needs a UTR (12 to 22 alphanumeric, unique across all payments via a unique index), an amount and a date. The API rejects amounts above the outstanding balance, non-positive amounts, future dates and dates before disbursement. The balance update is atomic (`amountPaid <= totalRepayment - amount` in the update filter), so two concurrent payments can't overpay. When `amountPaid` reaches `totalRepayment`, the loan moves to CLOSED in the same request.

**Auth and RBAC.** Passwords are hashed with bcrypt. Login sets an httpOnly, SameSite=Lax cookie with a JWT carrying `{ sub, role }`.

- Backend: `authenticate` verifies the token (`401` if missing or invalid), `authorize(...roles)` checks the role (`403` if not allowed). Every ops route lists its roles explicitly, e.g. `authorize("SANCTION", "ADMIN")`. Borrower routes allow only `BORROWER`.
- Frontend: `src/proxy.ts` verifies the same JWT and redirects users away from pages their role can't access; the dashboard nav only shows permitted modules. This is a UX layer; the API enforces access independently.

**File uploads.** Multer stores slips on local disk under random names (PDF/JPG/PNG, max 5 MB, checked by MIME type and extension). Files are never served statically, only through authenticated routes (the borrower's own slip, or Sanction/Admin for a loan under review).

## Data model

- **users**: name, email (unique), passwordHash, role, `profile` (fullName, PAN, DOB, monthly salary, employment mode; saved only if the BRE passes), `salarySlip`.
- **loans**: borrower ref, snapshot of the applicant profile and salary slip at apply time, principal, tenureDays, interestRate, interest, totalRepayment, amountPaid, status, isOpen, rejectionReason, and who/when for each transition.
- **payments**: loan ref, utr (unique), amount, paidOn, recordedBy.

The loan keeps its own copy of the applicant details so later profile edits don't change what was approved.

## API

All amounts are integer paise. Errors return `{ error, details? }`.

| Method | Path | Role | Notes |
| ------ | ---- | ---- | ----- |
| POST | `/api/auth/signup` | public | Creates a borrower |
| POST | `/api/auth/login` | public | Sets auth cookie |
| POST | `/api/auth/logout` | any | |
| GET | `/api/auth/me` | any | |
| GET | `/api/borrower/application` | Borrower | Profile and slip status |
| PUT | `/api/borrower/profile` | Borrower | Runs BRE; `422` with failed rules |
| POST | `/api/borrower/salary-slip` | Borrower | multipart `file` |
| GET | `/api/borrower/salary-slip` | Borrower | |
| POST | `/api/borrower/loans` | Borrower | `{ principal, tenureDays }` |
| GET | `/api/borrower/loans` | Borrower | Own loans with payments |
| GET | `/api/ops/sales/leads` | Sales, Admin | Borrowers with no loan yet |
| GET | `/api/ops/sanction/loans` | Sanction, Admin | APPLIED loans |
| GET | `/api/ops/sanction/loans/:id/salary-slip` | Sanction, Admin | |
| POST | `/api/ops/sanction/loans/:id/approve` | Sanction, Admin | → SANCTIONED |
| POST | `/api/ops/sanction/loans/:id/reject` | Sanction, Admin | `{ reason }` → REJECTED |
| GET | `/api/ops/disbursement/loans` | Disbursement, Admin | SANCTIONED loans |
| POST | `/api/ops/disbursement/loans/:id/disburse` | Disbursement, Admin | → DISBURSED |
| GET | `/api/ops/collection/loans` | Collection, Admin | DISBURSED loans |
| GET | `/api/ops/collection/loans/:id/payments` | Collection, Admin | |
| POST | `/api/ops/collection/loans/:id/payments` | Collection, Admin | `{ utr, amount, paidOn }`, auto-closes |

Status codes: `400` validation, `401` unauthenticated, `403` wrong role, `404` not found, `409` conflict (invalid transition, duplicate UTR, existing open loan), `422` BRE rejection.

## Project structure

```
server/src
  config/        env validation, db connection
  domain/        pure business rules: BRE, loan math, status transitions, roles
  middleware/    auth + RBAC, validation, uploads, error handler
  models/        User, Loan, Payment
  modules/       auth, borrower, ops (routes + services)
  scripts/seed.ts
client/src
  app/(auth)/        login, signup
  app/(borrower)/    apply (multi-step), my-loan
  app/dashboard/     sales, sanction, disbursement, collection
  components/        UI primitives, table, modal, header
  lib/               API client, session, roles, formatting, loan rules
  proxy.ts           route-level access control
```
