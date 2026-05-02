
# Product Requirements Document (PRD)

## Demo Credit Wallet Service (Lendsqr Assessment)

---

## 1. Overview

The Demo Credit Wallet Service is a backend system that enables users of a lending platform to manage funds through a digital wallet.

The service supports core financial operations including account creation, wallet funding, peer-to-peer transfers, and withdrawals.

The system also integrates with the Lendsqr Adjutor API to prevent onboarding of blacklisted users.

---

## 2. Objectives

### Primary Goal

Design and implement a secure, reliable, and transaction-safe wallet system that guarantees accurate balance management, atomic financial operations, and prevention of fraudulent onboarding.

### Success Criteria

* All monetary operations are transactionally consistent
* No operation results in inconsistent balances
* Blacklisted users are blocked during onboarding
* The API is covered with unit tests

---

## 3. Users

### End Users

* Borrowers using the Demo Credit mobile application

### System Actors

* Wallet Service API
* External blacklist service (Adjutor API)

---

## 4. Core Features

### 4.1 User Onboarding

#### Description

Allows a new user to create an account and automatically receive a wallet.

#### Requirements

* User provides required details such as name and email
* System verifies blacklist status via the Adjutor API

#### Acceptance Criteria

* User is created if not blacklisted
* User creation fails if blacklisted
* A wallet is automatically created upon successful onboarding

---

### 4.2 Wallet Funding

#### Description

Allows simulated funding of a user’s wallet.

#### Requirements

* User specifies an amount
* Wallet balance is incremented accordingly

#### Acceptance Criteria

* Balance is updated correctly
* A corresponding transaction record is created

---

### 4.3 Transfer Funds

#### Description

Enables users to transfer funds to other users within the system.

#### Requirements

* Both sender and receiver must exist
* Sender must have sufficient balance

#### Acceptance Criteria

* Sender balance is reduced
* Receiver balance is increased
* Operation is atomic (all or nothing)
* Operation fails if balance is insufficient

---

### 4.4 Withdraw Funds

#### Description

Allows users to withdraw funds from their wallet.

#### Requirements

* User specifies an amount
* Wallet balance is reduced accordingly

#### Acceptance Criteria

* Balance is reduced correctly
* Operation fails if balance is insufficient
* A transaction record is created

---

## 5. Functional Requirements

### 5.1 Wallet Management

* Each user has exactly one wallet
* A wallet stores:

  * Current balance
  * Currency (optional)

---

### 5.2 Transaction Ledger

All financial operations must be recorded in a transaction ledger.

Transaction types include:

* Credit (funding, incoming transfers)
* Debit (withdrawals, outgoing transfers)

Each transaction must include:

* Amount
* Type
* Status
* Reference ID
* Timestamp

---

### 5.3 Blacklist Integration

* During user signup:

  * Call the Adjutor API
  * Check blacklist (karma) status
* Prevent onboarding if the user is flagged

---

### 5.4 Authentication (Simplified)

* Use a simple token-based authentication mechanism
* Full authentication and authorization system is out of scope

---

## 6. Non-Functional Requirements

### 6.1 Data Consistency

* All financial operations must be executed within database transactions
* Prevent partial updates and race conditions

---

### 6.2 Performance

* System should handle concurrent requests safely
* Database queries should be efficient and properly indexed

---

### 6.3 Reliability

* The system must not allow:

  * Negative balances
  * Duplicate transactions

---

### 6.4 Maintainability

* Codebase should follow clean architecture principles
* Emphasize modularity and separation of concerns
* Avoid duplication

---

## 7. Data Model (High-Level)

### Entities

#### User

* id
* name
* email
* created_at

#### Wallet

* id
* user_id
* balance
* created_at

#### Transaction

* id
* wallet_id
* type (credit or debit)
* amount
* status
* reference
* created_at

---

### Relationships

* One user has one wallet
* One wallet has many transactions

---

## 8. API Endpoints (Proposed)

* POST /users
  Create a new user with blacklist verification

* POST /wallets/fund
  Fund a wallet

* POST /wallets/transfer
  Transfer funds between users

* POST /wallets/withdraw
  Withdraw funds

* GET /wallets/{userId}
  Retrieve wallet details

* GET /transactions/{userId}
  Retrieve transaction history

---

## 9. System Architecture

### Layers

* Controller layer: handles HTTP requests and responses
* Service layer: contains business logic
* Repository layer: manages database interactions

---

### Technology Stack

* Node.js (LTS)
* TypeScript
* Knex.js
* MySQL

---

## 10. Testing Strategy

### Unit Tests

#### Positive Cases

* Successful wallet funding
* Successful fund transfer
* Successful withdrawal

#### Negative Cases

* Insufficient balance
* Invalid user
* Blacklisted user

---

## 11. Deployment

* Deploy on platforms such as Render, Railway, or Heroku

Example URL format:

```
https://<candidate-name>-lendsqr-be-test.<platform-domain>
```

---

## 12. Deliverables

* GitHub repository
* Deployed API endpoint
* Documentation (including this PRD and design decisions)
* Entity Relationship Diagram
* Video walkthrough demonstrating the system

---

## 13. Assumptions

* No real payment gateway integration is required
* Authentication is simplified
* System operates on a single currency

---

## 14. Future Improvements

* Integration with a real payment gateway such as Paystack
* Full authentication and authorization system
* Rate limiting and fraud detection mechanisms
* Audit logging
* Multi-currency wallet support
