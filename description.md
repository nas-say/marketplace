# SideFlip — Product Description

## What is SideFlip?

SideFlip is an online marketplace for buying, selling, and beta testing indie software projects. It connects independent makers who want to exit their side projects with buyers looking to acquire small, already-built software businesses.

SideFlip is not a transaction platform — it is an **introduction platform**. All negotiations and payments for project sales happen directly between buyer and seller, off-platform.

---

## Core Features

### 1. Buy & Sell Projects

Sellers list their projects with:
- Title, description, category
- Metrics: MRR, monthly profit, visitors, registered users
- Asking price and "open to offers" flag
- Tech stack and assets included (source code, domain, user database, etc.)

Buyers browse listings and can **unlock seller contact info** by spending Connects (see below). Once contact is unlocked, the buyer reaches out directly to negotiate and close the deal.

### 2. Connects — The Credit System

Connects are SideFlip's digital credits.

- Buyers purchase Connects with real money via Razorpay (India) or Stripe (international)
- Connects are spent to unlock seller contact information on a listing
- Connects have no cash value, cannot be transferred, and do not expire
- Purchased Connects are non-refundable

**Why Connects instead of direct payment?**
It creates a friction point that filters serious buyers from casual browsers, while keeping the actual deal off-platform where SideFlip has no liability.

### 3. Beta Testing

Sellers can recruit beta testers for their projects before or during a sale listing.

Creators post a beta test with:
- Description and testing instructions
- Number of tester spots
- Deadline
- Reward type: **cash** or **premium access**

**Cash reward**: Creator funds the reward pool via Razorpay. SideFlip holds the funds and manually pays out to accepted testers via UPI after the creator approves them.

**Premium access reward**: Creator grants free access to their product (e.g., "3 months Pro plan") to accepted testers. Tester provides their email at apply time; creator grants access manually.

Testers apply, creator approves or rejects applicants from their dashboard, and accepted testers submit structured feedback (star rating, feedback type, comment).

### 4. Seller Profiles

Every user gets a public seller profile showing:
- Display name, bio, location, website, social links
- All active listings
- Beta tests they've created
- Stats: total sales, feedback given, beta tests completed

### 5. Watchlist

Logged-in users can save listings to a watchlist for later reference.

### 6. Dashboard

Split into two views:

**As Seller:**
- Active listings with metrics
- Beta tests created, with applicant management
- Recent activity feed

**As Buyer:**
- Listings they've unlocked (contact info revealed)
- Beta tests they've applied to, with application status
- Connects balance and transaction history

---

## How a Project Sale Works (Step by Step)

1. Seller creates a listing with metrics and asking price
2. Seller verifies ownership (GitHub repo, domain DNS, or manual)
3. Listing goes live and is visible to all visitors
4. Buyer browses and finds an interesting listing
5. Buyer spends Connects to unlock the seller's contact info
6. Buyer contacts the seller directly (email, Twitter, etc.)
7. Buyer and seller negotiate, agree on price, and close the deal off-platform
8. SideFlip is not involved in the payment or transfer

---

## How Beta Testing Works (Step by Step)

1. Creator posts a beta test with reward type (cash or premium access)
2. If cash: creator funds the reward pool via Razorpay before applications open
3. Testers browse available beta tests and apply
   - Cash tests: tester provides UPI ID at apply time
   - Premium access tests: tester provides email at apply time
4. Creator reviews applicants in their dashboard and approves or rejects
5. Accepted testers test the product and submit feedback (rating + comment)
6. Creator sees all feedback in their dashboard
7. Payouts: SideFlip manually transfers cash rewards to approved testers' UPI IDs

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Auth**: Clerk (email/password, Google OAuth, session management)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Payments**: Razorpay (INR — Connects purchases + beta reward pool funding)
- **Hosting**: Vercel

---

## Business Model

SideFlip earns revenue when buyers purchase Connects packages. There is no commission on project sales (since transactions are off-platform). Beta test reward funding passes through SideFlip's Razorpay account; payouts to testers are done manually by the operator.

---

## What SideFlip Is Not

- Not an escrow service — project sale payments happen between buyer and seller directly
- Not a freelance platform — projects are sold outright, not hired out
- Not a SaaS marketplace aggregator — focused on indie/solo maker projects, not enterprise software
- Not a registered company — operated as a personal project by an individual
