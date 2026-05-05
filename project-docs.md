# Project Documentation

## Project

This is my implementation of the Lendsqr backend engineering assessment. The goal was to build an MVP wallet service for a mobile lending product where users can create accounts, receive funds, transfer money, and withdraw from their wallets.

The live service is deployed on Render:

- Base URL: https://williams-samuel-lendsqr-be-test.onrender.com/
- API docs: https://williams-samuel-lendsqr-be-test.onrender.com/docs
- Health check: https://williams-samuel-lendsqr-be-test.onrender.com/health

## Assessment Requirements Covered

| Requirement | Implementation |
| --- | --- |
| User can create an account | `POST /api/v1/auth/register` creates a user and wallet |
| User can fund their account | `POST /api/v1/wallets/fund` funds the authenticated user's wallet |
| User can transfer funds | `POST /api/v1/wallets/transfer` transfers to receiver user ID or account number |
| User can withdraw funds | `POST /api/v1/wallets/withdraw` withdraws from authenticated user's wallet |
| Karma blacklist check | Registration calls Lendsqr Adjutor Karma before onboarding |
| Node.js with TypeScript | Express API written in TypeScript |
| Knex ORM | Repositories and migrations use Knex |
| MySQL | Runtime database client is `mysql2` |
| Unit tests | Jest tests cover wallet, schema, and template behavior |
| E-R diagram | ERD included in README and `database-erd/` |
| Public deployment | Render deployment is live |
| API documentation | Swagger UI available at `/docs` |

## Architecture Overview

The application is organized around a layered backend structure:

- Routes define the public HTTP surface.
- Controllers validate request bodies and translate HTTP input into service calls.
- Services contain business rules, transactions, and orchestration.
- Repositories contain database access functions.
- Utilities contain shared helpers for IDs, money parsing, account numbers, auth, and errors.
- Middleware handles authentication, authorization, and error responses.
- Email templates are rendered using Handlebars.

This split keeps wallet logic out of controllers and keeps raw database access out of business workflows.

## Main Design Decisions

### Auth

The assessment allowed a faux token-based authentication system, but the project includes a fuller JWT flow as well:

- Passwords are hashed with Argon2.
- Login returns a JWT.
- Protected routes use `Authorization: Bearer <token>`.
- A configurable `API_TOKEN` remains available as a faux token path.
- Email verification is required before wallet operations.

This gives the assessment-friendly token behavior while still demonstrating a realistic authentication boundary.

### Blacklist Verification

Before a user is onboarded, registration calls the Lendsqr Adjutor Karma endpoint through `src/clients/adjutor.client.ts` and `src/services/adjutor.service.ts`.

If the response indicates Karma data for the email identity, onboarding is blocked.

### Wallet Ownership

Wallet operations are scoped to the authenticated user:

- Funding does not accept a target user ID.
- Withdrawal does not accept a target user ID.
- Transfer uses the authenticated user as sender.

This prevents clients from funding or withdrawing from arbitrary wallets by sending someone else's `userId`.

### Account Numbers

Every wallet has a unique 11-digit `account_number`.

The account number is generated with random digits and checked for uniqueness before wallet creation. Existing wallets are backfilled by `migrations/003_wallet_account_number.js`.

Transfers can resolve the receiver by:

- `receiverAccountNumber`
- `receiverUserId`

The request must include exactly one of those fields.

### Money Handling

Money values are parsed through `decimal.js` in `src/utils/money.ts`.

The rules are:

- Amount must be finite.
- Amount must be greater than zero.
- Amount can have at most two decimal places.
- Arithmetic is done with decimals, not JavaScript floating point math.

### Transaction Scoping

Balance-changing operations use database transactions.

Funding:

- Lock requesting user's wallet row.
- Insert credit transaction.
- Update wallet balance.
- Commit.
- Send notification after commit.

Withdrawal:

- Lock requesting user's wallet row.
- Check sufficient balance.
- Insert debit transaction.
- Update wallet balance.
- Commit.
- Send notification after commit.

Transfer:

- Resolve sender wallet.
- Resolve receiver wallet by account number or user ID.
- Lock both wallet rows in deterministic wallet ID order.
- Check sufficient balance.
- Insert transfer record.
- Insert sender debit transaction.
- Insert receiver credit transaction.
- Update both balances.
- Commit.
- Send receiver notification after commit.

Emails are intentionally sent after transaction commit so a failed email provider does not roll back a successful financial operation.

## Database Design

The schema has four main tables:

- `users`
- `wallets`
- `transactions`
- `transfers`

### Users

Stores identity, authentication, verification, and access flags.

Important columns:

- `email` is unique.
- `password_hash` stores the Argon2 hash.
- `is_email_verified` gates wallet operations.
- `email_verification_token_hash` stores a hashed verification token.

### Wallets

Stores wallet ownership and balance.

Important columns:

- `user_id` is unique, giving one wallet per user.
- `account_number` is unique and 11 digits.
- `balance` is a `decimal(18,2)`.
- A database check constraint prevents negative wallet balances.

### Transactions

Stores ledger entries for each wallet.

Important columns:

- `wallet_id` links to the wallet.
- `type` is `credit` or `debit`.
- `reference` is unique.
- `metadata` stores transfer context where needed.

### Transfers

Stores high-level transfer records.

Important columns:

- `sender_wallet_id`
- `receiver_wallet_id`
- `amount`
- `reference`
- `status`

## ERD

![Database ERD](database-erd/database-erd-screenshot.png)

The DBML source is stored in:

- `src/db/db.dbml`
- `database-erd/db.dbml`

## API Design

All API routes are mounted under `/api/v1`.

### Auth Endpoints

#### Register

`POST /api/v1/auth/register`

Creates a user, verifies the user is not blacklisted, creates a wallet, and sends an email verification link.

Example body:

```json
{
  "firstName": "William",
  "lastName": "Samuel",
  "email": "william@example.com",
  "password": "password123"
}
```

#### Login

`POST /api/v1/auth/login`

Returns a JWT for verified users and sends a successful login notification.

Example body:

```json
{
  "email": "william@example.com",
  "password": "password123"
}
```

#### Resend Verification

`POST /api/v1/auth/resend-verification`

Resends a verification email after validating credentials.

#### Verify Email

`GET /api/v1/auth/verify?token=<token>`

Verifies the user's email using the token sent by email.

### Wallet Endpoints

Wallet endpoints require authentication and verified email.

#### Fund Wallet

`POST /api/v1/wallets/fund`

Example body:

```json
{
  "amount": "1000.00"
}
```

#### Withdraw

`POST /api/v1/wallets/withdraw`

Example body:

```json
{
  "amount": "250.00"
}
```

#### Transfer

`POST /api/v1/wallets/transfer`

Transfer by account number:

```json
{
  "receiverAccountNumber": "12345678901",
  "amount": "500.00"
}
```

Transfer by user ID:

```json
{
  "receiverUserId": "user-uuid",
  "amount": "500.00"
}
```

Exactly one receiver identifier is required.

#### Balance

`GET /api/v1/wallets/balance`

Returns the authenticated user's wallet balance and account number.

#### Transactions

`GET /api/v1/wallets/transactions`

Returns the authenticated user's wallet transaction history.

### User Endpoints

#### Current User

`GET /api/v1/users/me`

Returns the authenticated user's profile.

#### List Users

`GET /api/v1/users`

Admin-only endpoint.

#### Get User By ID

`GET /api/v1/users/:userId`

Admin-only endpoint.

## Validation

Zod validates request bodies and route params before service logic runs.

Important validation rules:

- Amounts must be strings or numbers and are normalized by the money utility.
- Transfer must provide exactly one receiver identifier.
- Account numbers must be exactly 11 digits.
- Fund and withdrawal request bodies are strict and only accept `amount`.

## Email System

Emails are rendered with Handlebars templates from `src/email_templates/`.

Templates include:

- `verification.html`
- `wallet-funded.html`
- `wallet-withdrawn.html`
- `transfer-received.html`
- `login-success.html`

Notifications are sent for:

- Wallet funding
- Wallet withdrawal
- Transfer received
- Successful login
- Email verification

The email sending layer is separate from template rendering and uses ZeptoMail.

## Error Handling

Errors are normalized through `ApiError` and returned with a consistent shape:

```json
{
  "error": "bad_request",
  "message": "Invalid request body",
  "details": {}
}
```

Unexpected errors return a generic `internal_server_error` response.

## Testing Strategy

The project uses Jest and ts-jest.

Test files include:

- `__tests__/wallet.service.test.ts`
- `__tests__/wallet.schema.test.ts`
- `__tests__/email_templates.test.ts`
- `__tests__/email.service.test.ts`

### Wallet Tests

The wallet service tests cover positive and negative money movement scenarios:

Funding:

- Balance increases correctly.
- Transaction record is created.
- Invalid amounts fail.

Withdrawals:

- Balance decreases correctly.
- Insufficient funds fail.
- Negative balances never occur.

Transfers:

- Sender balance decreases.
- Receiver balance increases.
- Transfer and transaction rows are created.
- Insufficient balance rolls back both wallets.
- Invalid receiver rolls back all changes.
- Simulated database failure mid-transaction rolls back transfer and transaction records.

### Running Tests

```bash
npm test
```

Focused wallet tests:

```bash
npm test -- --runTestsByPath __tests__/wallet.service.test.ts
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Run migrations:

```bash
npm run migrate
```

Start dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start compiled server:

```bash
npm start
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port |
| `API_TOKEN` | Faux bearer token |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database |
| `DB_POOL_MAX` | Knex pool max |
| `ADJUTOR_BASE_URL` | Lendsqr Adjutor base URL |
| `ADJUTOR_API_KEY` | Lendsqr Adjutor API key |
| `ADJUTOR_TIMEOUT_MS` | Adjutor request timeout |
| `DOCS_UI_ENABLED` | Enable Swagger UI |
| `BACKEND_BASE_URL` | Public backend URL used in verification links |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiry |
| `EMAIL_VERIFICATION_TTL_HOURS` | Verification token TTL |
| `DUMMY_USER_EMAIL` | Faux token user email |
| `DUMMY_USER_FIRST_NAME` | Faux token user first name |
| `DUMMY_USER_LAST_NAME` | Faux token user last name |
| `DUMMY_USER_PASSWORD` | Faux token user password |
| `DUMMY_USER_EMAIL_VERIFIED` | Faux token user verification state |
| `ZEPTOMAIL_API_KEY` | ZeptoMail key |
| `ZEPTOMAIL_FROM_ADDRESS` | Sender address |
| `ZEPTOMAIL_FROM_NAME` | Sender name |
| `ZEPTOMAIL_BOUNCE_ADDRESS` | Bounce address |
| `ZEPTOMAIL_BASE_URL` | Optional ZeptoMail override |
| `ZEPTOMAIL_TEST_MODE` | ZeptoMail test mode |

## Deployment

The API is deployed on Render at:

https://williams-samuel-lendsqr-be-test.onrender.com/

The hosted API documentation is available at:

https://williams-samuel-lendsqr-be-test.onrender.com/docs

## Screenshots

### Render Deployment

![Render deployment screenshot](.docs/project-screenshot-onrender.png)

### Swagger Documentation

![Swagger documentation screenshot](.docs/swagger-docs-screenshot.png)

## Final Review

This implementation satisfies the core wallet MVP requirements and adds additional production-style guardrails:

- Request validation at the API boundary
- Decimal-safe money operations
- Database-level non-negative balance constraint
- Row-level locking for wallet balance changes
- Atomic transaction handling for money movement
- Transaction and transfer audit records
- Email notifications with Handlebars templates
- OpenAPI documentation
- Focused tests for both successful and failure scenarios

The main tradeoff is that the authentication system is intentionally lightweight for the assessment context. It includes JWTs and email verification, but it does not attempt to implement a full production identity platform with refresh tokens, device management, or password reset flows.
