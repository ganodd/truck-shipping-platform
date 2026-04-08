# Implementation Plan: Digital Freight Marketplace ("TruckShip")

## Overview

This plan details the construction of a digital freight marketplace connecting shippers and truck carriers. The platform consists of 7 microservices, a Next.js web application (shipper portal, dispatcher dashboard, admin dashboard), and a React Native mobile app (driver app). The architecture follows a monorepo approach using Turborepo, with PostgreSQL for persistence, Redis for real-time pub/sub and caching, Stripe for payments, and Google Maps for routing/geocoding. The plan spans 4 phases from April through November 2026, with each phase independently deliverable.

## Monorepo Structure

```
C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Lint, test, build on every PR
│       ├── deploy-staging.yml              # Deploy to staging on merge to develop
│       └── deploy-production.yml           # Deploy to production on merge to main
├── .husky/                                 # Git hooks (pre-commit lint, commit-msg)
├── docker/
│   ├── docker-compose.yml                  # Local dev: PostgreSQL, Redis, Keycloak
│   ├── docker-compose.prod.yml             # Production compose (reference)
│   ├── Dockerfile.service                  # Multi-stage Dockerfile for backend services
│   ├── Dockerfile.web                      # Dockerfile for Next.js web app
│   └── Dockerfile.mobile                   # (For CI builds of mobile app)
├── infrastructure/
│   ├── terraform/
│   │   ├── main.tf                         # AWS provider, state backend
│   │   ├── vpc.tf                          # VPC, subnets, security groups
│   │   ├── rds.tf                          # PostgreSQL RDS instance
│   │   ├── elasticache.tf                  # Redis ElastiCache
│   │   ├── ecs.tf                          # ECS Fargate cluster & services
│   │   ├── alb.tf                          # Application Load Balancer
│   │   ├── s3.tf                           # Document storage bucket
│   │   ├── cloudfront.tf                   # CDN for web app
│   │   └── variables.tf
│   └── k8s/                                # (Future: Kubernetes manifests if migrating from ECS)
├── packages/
│   ├── shared-types/                       # Shared TypeScript types/interfaces
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── user.ts                     # User, Role, AuthPayload types
│   │   │   ├── load.ts                     # Load, LoadStatus, EquipmentType
│   │   │   ├── bid.ts                      # Bid, BidStatus
│   │   │   ├── shipment.ts                 # Shipment, ShipmentStatus, StatusEvent
│   │   │   ├── vehicle.ts                  # Vehicle, VehicleType
│   │   │   ├── document.ts                 # Document, DocumentType
│   │   │   ├── payment.ts                  # Payment, Invoice, PaymentStatus
│   │   │   ├── rating.ts                   # Rating
│   │   │   ├── notification.ts             # Notification, NotificationType
│   │   │   └── api-responses.ts            # Standard API envelope types
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared-validators/                  # Zod schemas shared between frontend and backend
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── auth.schema.ts
│   │   │   ├── load.schema.ts
│   │   │   ├── bid.schema.ts
│   │   │   ├── shipment.schema.ts
│   │   │   ├── vehicle.schema.ts
│   │   │   └── payment.schema.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared-utils/                       # Shared utility functions
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── date.ts                     # Timezone-aware date utilities
│   │   │   ├── currency.ts                 # Money formatting, cent conversion
│   │   │   ├── geo.ts                      # Distance calculation, coordinate helpers
│   │   │   └── constants.ts                # Enums, status maps, equipment types
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── database/                           # Database migrations, seeds, and Prisma schema
│       ├── prisma/
│       │   ├── schema.prisma               # Full data model
│       │   ├── migrations/                 # Versioned SQL migrations
│       │   └── seed.ts                     # Dev seed data
│       ├── package.json
│       └── tsconfig.json
├── services/
│   ├── api-gateway/                        # Express/NestJS API Gateway
│   │   ├── src/
│   │   │   ├── main.ts                     # Entry point
│   │   │   ├── app.module.ts               # NestJS module (or Express app setup)
│   │   │   ├── config/
│   │   │   │   └── index.ts                # Environment config loader
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts       # JWT verification, role extraction
│   │   │   │   ├── rate-limiter.ts         # Rate limiting per endpoint
│   │   │   │   ├── request-logger.ts       # Structured request logging
│   │   │   │   └── error-handler.ts        # Global error handler
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── load.routes.ts
│   │   │   │   ├── bid.routes.ts
│   │   │   │   ├── shipment.routes.ts
│   │   │   │   ├── vehicle.routes.ts
│   │   │   │   ├── document.routes.ts
│   │   │   │   ├── payment.routes.ts
│   │   │   │   ├── rating.routes.ts
│   │   │   │   ├── notification.routes.ts
│   │   │   │   ├── admin.routes.ts
│   │   │   │   └── health.routes.ts
│   │   │   └── guards/
│   │   │       ├── roles.guard.ts          # RBAC decorator/guard
│   │   │       └── ownership.guard.ts      # Resource ownership checks
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── user-service/                       # User management & auth
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── user.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts      # Login, register, verify, refresh
│   │   │   │   └── user.controller.ts      # Profile CRUD, KYC status
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts         # JWT issuance, Keycloak integration
│   │   │   │   ├── user.service.ts         # User CRUD
│   │   │   │   └── kyc.service.ts          # Document verification status
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts      # Prisma-based data access
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── matching-service/                   # Load matching engine
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── controllers/
│   │   │   │   ├── load.controller.ts      # Load CRUD, search
│   │   │   │   └── bid.controller.ts       # Bid CRUD, accept/reject
│   │   │   ├── services/
│   │   │   │   ├── load.service.ts
│   │   │   │   ├── bid.service.ts
│   │   │   │   └── matching-engine.ts      # Rule-based matching algorithm
│   │   │   ├── repositories/
│   │   │   │   ├── load.repository.ts
│   │   │   │   └── bid.repository.ts
│   │   │   └── algorithms/
│   │   │       ├── score-calculator.ts     # Match scoring (equipment, distance, rating)
│   │   │       └── filter-engine.ts        # Pre-filtering eligible carriers
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── dispatch-service/                   # Shipment lifecycle management
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── controllers/
│   │   │   │   ├── shipment.controller.ts  # Shipment CRUD, status transitions
│   │   │   │   └── assignment.controller.ts# Dispatcher load assignment
│   │   │   ├── services/
│   │   │   │   ├── shipment.service.ts     # State machine for shipment lifecycle
│   │   │   │   └── assignment.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── shipment.repository.ts
│   │   │   └── state-machine/
│   │   │       └── shipment-states.ts      # Valid state transitions
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── tracking-service/                   # Real-time GPS tracking
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── controllers/
│   │   │   │   └── tracking.controller.ts  # REST endpoints for location history
│   │   │   ├── services/
│   │   │   │   ├── tracking.service.ts     # Process & store location updates
│   │   │   │   └── geofence.service.ts     # Geofence enter/exit detection
│   │   │   ├── gateways/
│   │   │   │   └── tracking.gateway.ts     # WebSocket gateway for live updates
│   │   │   └── repositories/
│   │   │       └── location.repository.ts  # Time-series location storage
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── payment-service/                    # Billing, invoicing, Stripe
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── controllers/
│   │   │   │   ├── payment.controller.ts   # Payment status, history
│   │   │   │   ├── invoice.controller.ts   # Invoice generation, PDF
│   │   │   │   └── webhook.controller.ts   # Stripe webhook handler
│   │   │   ├── services/
│   │   │   │   ├── stripe.service.ts       # Stripe API wrapper
│   │   │   │   ├── invoice.service.ts      # Invoice generation logic
│   │   │   │   └── payment.service.ts      # Payment orchestration
│   │   │   └── repositories/
│   │   │       ├── payment.repository.ts
│   │   │       └── invoice.repository.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── notification-service/               # Push, email, SMS
│       ├── src/
│       │   ├── main.ts
│       │   ├── controllers/
│       │   │   └── notification.controller.ts
│       │   ├── services/
│       │   │   ├── notification.service.ts # Route to appropriate channel
│       │   │   ├── email.service.ts        # SendGrid integration
│       │   │   ├── push.service.ts         # Firebase Cloud Messaging
│       │   │   └── sms.service.ts          # Twilio integration
│       │   ├── templates/
│       │   │   ├── booking-confirmed.hbs
│       │   │   ├── status-update.hbs
│       │   │   ├── payment-received.hbs
│       │   │   └── document-requested.hbs
│       │   └── repositories/
│       │       └── notification.repository.ts
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── web/                                # Next.js web application
│   │   ├── src/
│   │   │   ├── app/                        # Next.js App Router
│   │   │   │   ├── layout.tsx              # Root layout
│   │   │   │   ├── page.tsx                # Landing page
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   └── verify/page.tsx
│   │   │   │   ├── (shipper)/
│   │   │   │   │   ├── layout.tsx          # Shipper sidebar layout
│   │   │   │   │   ├── dashboard/page.tsx  # Shipper overview
│   │   │   │   │   ├── loads/
│   │   │   │   │   │   ├── page.tsx        # My loads list
│   │   │   │   │   │   ├── new/page.tsx    # Create load form
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx    # Load detail + bids
│   │   │   │   │   │       └── track/page.tsx # Live tracking map
│   │   │   │   │   ├── shipments/
│   │   │   │   │   │   ├── page.tsx        # Active shipments
│   │   │   │   │   │   └── [id]/page.tsx   # Shipment detail
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   └── page.tsx        # Payment history & invoices
│   │   │   │   │   └── settings/page.tsx   # Profile, company info
│   │   │   │   ├── (dispatcher)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── dashboard/page.tsx  # Fleet overview map
│   │   │   │   │   ├── assignments/page.tsx# Load assignment board
│   │   │   │   │   ├── drivers/page.tsx    # Driver list + status
│   │   │   │   │   └── compliance/page.tsx # HOS, documents
│   │   │   │   └── (admin)/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── dashboard/page.tsx  # KPIs, system health
│   │   │   │       ├── users/page.tsx      # User management table
│   │   │   │       ├── shipments/page.tsx  # All shipments
│   │   │   │       ├── payments/page.tsx   # All payments
│   │   │   │       ├── analytics/page.tsx  # Charts, reports
│   │   │   │       └── settings/page.tsx   # Platform config
│   │   │   ├── components/
│   │   │   │   ├── ui/                     # Shadcn/UI primitives
│   │   │   │   ├── layout/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   └── footer.tsx
│   │   │   │   ├── maps/
│   │   │   │   │   ├── tracking-map.tsx    # Google Maps live tracking
│   │   │   │   │   └── route-preview.tsx   # Static route display
│   │   │   │   ├── loads/
│   │   │   │   │   ├── load-form.tsx       # Create/edit load form
│   │   │   │   │   ├── load-card.tsx       # Load summary card
│   │   │   │   │   └── load-filters.tsx    # Search/filter controls
│   │   │   │   ├── bids/
│   │   │   │   │   ├── bid-list.tsx
│   │   │   │   │   └── bid-card.tsx
│   │   │   │   ├── shipments/
│   │   │   │   │   ├── shipment-timeline.tsx
│   │   │   │   │   └── status-badge.tsx
│   │   │   │   ├── payments/
│   │   │   │   │   ├── payment-table.tsx
│   │   │   │   │   └── invoice-viewer.tsx
│   │   │   │   └── ratings/
│   │   │   │       ├── star-rating.tsx
│   │   │   │       └── review-card.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-loads.ts
│   │   │   │   ├── use-shipments.ts
│   │   │   │   ├── use-tracking.ts         # WebSocket hook for live location
│   │   │   │   └── use-notifications.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts           # Axios/fetch wrapper with auth
│   │   │   │   ├── auth.ts                 # Token storage, refresh logic
│   │   │   │   ├── websocket.ts            # Socket.IO client setup
│   │   │   │   └── maps.ts                 # Google Maps loader
│   │   │   └── stores/
│   │   │       ├── auth.store.ts           # Zustand auth state
│   │   │       └── notification.store.ts
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/                             # React Native driver app
│       ├── src/
│       │   ├── App.tsx
│       │   ├── navigation/
│       │   │   ├── root-navigator.tsx
│       │   │   ├── auth-navigator.tsx
│       │   │   └── main-navigator.tsx      # Tab navigator (Loads, Active, Docs, Pay, Profile)
│       │   ├── screens/
│       │   │   ├── auth/
│       │   │   │   ├── login.screen.tsx
│       │   │   │   ├── register.screen.tsx
│       │   │   │   └── onboarding.screen.tsx # Preferences, doc upload
│       │   │   ├── loads/
│       │   │   │   ├── load-board.screen.tsx   # Available loads list
│       │   │   │   ├── load-detail.screen.tsx  # Load detail + bid/accept
│       │   │   │   └── load-map.screen.tsx     # Route preview on map
│       │   │   ├── active-shipment/
│       │   │   │   ├── active-shipment.screen.tsx  # Current shipment + navigation
│       │   │   │   ├── status-update.screen.tsx    # Update status buttons
│       │   │   │   └── pod-upload.screen.tsx       # Camera + photo upload for POD
│       │   │   ├── documents/
│       │   │   │   ├── document-list.screen.tsx
│       │   │   │   └── document-upload.screen.tsx
│       │   │   ├── payments/
│       │   │   │   ├── payment-history.screen.tsx
│       │   │   │   └── payment-detail.screen.tsx
│       │   │   └── profile/
│       │   │       ├── profile.screen.tsx
│       │   │       ├── vehicle-management.screen.tsx
│       │   │       └── settings.screen.tsx
│       │   ├── components/
│       │   │   ├── load-card.tsx
│       │   │   ├── shipment-status-bar.tsx
│       │   │   ├── map-view.tsx
│       │   │   ├── document-picker.tsx
│       │   │   ├── camera-capture.tsx
│       │   │   └── star-rating.tsx
│       │   ├── services/
│       │   │   ├── api.ts                  # API client with token refresh
│       │   │   ├── location.ts             # Background GPS tracking service
│       │   │   ├── push-notifications.ts   # FCM token registration
│       │   │   └── offline-queue.ts        # Queue actions when offline, sync later
│       │   ├── hooks/
│       │   │   ├── use-auth.ts
│       │   │   ├── use-location.ts
│       │   │   └── use-websocket.ts
│       │   └── stores/
│       │       ├── auth.store.ts
│       │       └── shipment.store.ts
│       ├── android/
│       ├── ios/
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── turbo.json                              # Turborepo pipeline config
├── package.json                            # Root package.json (workspaces)
├── pnpm-workspace.yaml                     # pnpm workspace definition
├── tsconfig.base.json                      # Base TypeScript config
├── .eslintrc.js                            # Shared ESLint config
├── .prettierrc                             # Shared Prettier config
├── .env.example                            # Documented env vars template
├── .gitignore
├── CLAUDE.MD                               # Project spec (existing)
└── README.md
```

## Requirements Summary

- 4 user roles: Carrier Driver (mobile), Shipper (web), Dispatcher (web), Admin (web)
- 7 microservices: API Gateway, User/Auth, Matching, Dispatch, Tracking, Payment, Notification
- Core value loop: Post load -> Match/Bid -> Book -> Execute -> Deliver -> Pay -> Rate
- Real-time GPS tracking via WebSocket + Redis pub/sub
- Document upload (POD, BOL, receipts) to S3
- Stripe payment processing with webhook-driven state sync
- Push notifications via FCM, email via SendGrid, SMS via Twilio
- Google Maps for geocoding, routing, and live tracking display
- 80%+ test coverage, TDD approach
- API response times under 500ms

## Implementation Steps

---

### Phase 1: Foundation and Scaffolding (April 6 -- May 3, 2026) -- 4 weeks

This phase produces a bootable monorepo with working CI, a fully migrated database, authenticated API gateway, and basic user registration. By the end of Phase 1, a developer can register, log in, and receive a JWT -- the skeleton on which every subsequent feature is built.

#### Week 1: Monorepo Bootstrapping & DevOps Foundation

**1.1 Initialize monorepo with Turborepo and pnpm** (Files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`)
- Action: Run `pnpm init` at the root. Create `pnpm-workspace.yaml` listing `packages/*`, `services/*`, `apps/*`. Create `turbo.json` with pipeline definitions for `build`, `dev`, `test`, `lint`, `typecheck`. Create `tsconfig.base.json` with strict TypeScript settings (strict: true, noUncheckedIndexedAccess: true, paths for `@truck-shipping/*`).
- Why: Turborepo provides incremental builds and task orchestration across the monorepo. pnpm's workspace protocol gives deterministic dependency resolution with minimal disk usage.
- Dependencies: None
- Risk: Low

**1.2 Configure ESLint, Prettier, and Husky** (Files: `.eslintrc.js`, `.prettierrc`, `.husky/pre-commit`)
- Action: Install `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-import`, `prettier`, `husky`, `lint-staged`. Configure ESLint with TypeScript rules and import ordering. Configure Prettier with 2-space indent, single quotes, trailing commas. Set up Husky pre-commit hook to run `lint-staged` (ESLint + Prettier on staged files).
- Why: Enforces consistent code style from the first commit. Catches errors early.
- Dependencies: Step 1.1
- Risk: Low

**1.3 Create `.env.example` and config management pattern** (Files: `.env.example`, `packages/shared-utils/src/config.ts`)
- Action: Document all required environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, GOOGLE_MAPS_API_KEY, FCM_SERVER_KEY, SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, AWS_S3_BUCKET, KEYCLOAK_URL, etc.). Create a typed config loader using `zod` that validates env vars at service startup and fails fast with clear error messages.
- Why: Prevents secrets from being committed. Fail-fast config validation avoids runtime surprises.
- Dependencies: Step 1.1
- Risk: Low

**1.4 Set up Docker Compose for local development** (File: `docker/docker-compose.yml`)
- Action: Define services for PostgreSQL 16 (port 5432, volume for persistence), Redis 7 (port 6379), and Keycloak 24 (port 8080, with `truck-shipping` realm pre-configured). Include health checks for all services. Add a `Makefile` or `package.json` scripts for `dev:infra` (starts Docker), `dev:services` (starts all backend services), `dev:web` (starts Next.js), etc.
- Why: Every developer gets an identical local environment with one command. No "works on my machine" issues.
- Dependencies: Step 1.1
- Risk: Low

**1.5 Configure GitHub Actions CI pipeline** (File: `.github/workflows/ci.yml`)
- Action: Create workflow triggered on pull requests to `develop` and `main`. Steps: checkout, setup pnpm, install dependencies, run `turbo lint`, `turbo typecheck`, `turbo test`, `turbo build`. Use PostgreSQL and Redis service containers for integration tests. Cache pnpm store and Turborepo cache between runs.
- Why: Automated quality gate. No broken code reaches the main branch.
- Dependencies: Steps 1.1, 1.2
- Risk: Low

**1.6 Create `.gitignore` and initialize Git repository** (File: `.gitignore`)
- Action: Initialize git repo. Create comprehensive `.gitignore` (node_modules, dist, .env, .turbo, coverage, .next, android/app/build, ios/Pods). Make initial commit with monorepo skeleton.
- Why: Version control from day one. Clean repo without build artifacts.
- Dependencies: Step 1.1
- Risk: Low

#### Week 2: Shared Packages & Database Schema

**1.7 Create `shared-types` package** (File: `packages/shared-types/src/*.ts`)
- Action: Define all core TypeScript interfaces and enums:
  - `user.ts`: `User`, `UserRole` (SHIPPER, CARRIER, DISPATCHER, ADMIN), `AuthTokens`, `KycStatus`
  - `load.ts`: `Load`, `LoadStatus` (DRAFT, AVAILABLE, MATCHED, BOOKED, COMPLETED, CANCELLED), `EquipmentType` (DRY_VAN, FLATBED, REEFER, etc.), `LoadDimensions`
  - `bid.ts`: `Bid`, `BidStatus` (PENDING, ACCEPTED, REJECTED, WITHDRAWN)
  - `shipment.ts`: `Shipment`, `ShipmentStatus` (PENDING_PICKUP, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED), `StatusEvent`
  - `vehicle.ts`: `Vehicle`, `VehicleType`
  - `document.ts`: `Document`, `DocumentType` (POD, BOL, RECEIPT, LICENSE, INSURANCE)
  - `payment.ts`: `Payment`, `PaymentStatus` (PENDING, PROCESSING, COMPLETED, FAILED), `Invoice`, `FeeType` (LINEHAUL, DETENTION, LUMPER, ACCESSORIAL)
  - `rating.ts`: `Rating`
  - `notification.ts`: `NotificationType` (BOOKING_CONFIRMED, STATUS_CHANGED, PAYMENT_RECEIVED, DOCUMENT_REQUESTED)
  - `api-responses.ts`: `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`
- Why: Single source of truth for all type definitions. Prevents type drift between services and frontends.
- Dependencies: Step 1.1
- Risk: Low

**1.8 Create `shared-validators` package** (File: `packages/shared-validators/src/*.ts`)
- Action: Define Zod schemas for every entity that crosses an API boundary:
  - `auth.schema.ts`: `registerSchema` (email, password, role, companyName, phone), `loginSchema`
  - `load.schema.ts`: `createLoadSchema` (origin, destination with geocoded lat/lng, equipment type, weight, dimensions, pickup window, delivery window, description, special instructions, budget range)
  - `bid.schema.ts`: `createBidSchema` (loadId, amount, estimatedPickup, estimatedDelivery, notes)
  - `shipment.schema.ts`: `updateStatusSchema` (status, latitude, longitude, notes)
  - `vehicle.schema.ts`: `createVehicleSchema` (type, make, model, year, licensePlate, capacity)
  - `payment.schema.ts`: `createPaymentSchema`
- Why: Identical validation on client and server. Zod provides both runtime validation and TypeScript type inference.
- Dependencies: Step 1.7
- Risk: Low

**1.9 Create `shared-utils` package** (File: `packages/shared-utils/src/*.ts`)
- Action: Implement utility functions:
  - `date.ts`: timezone-aware formatting, relative time ("2 hours ago"), pickup window display
  - `currency.ts`: cents-to-dollars conversion, format with commas and currency symbol, parse user input to cents
  - `geo.ts`: haversine distance between two points, bearing calculation, format coordinates
  - `constants.ts`: equipment type labels, status display strings, fee type labels
- Why: DRY utilities prevent inconsistent formatting across web, mobile, and services.
- Dependencies: Step 1.1
- Risk: Low

**1.10 Design and create Prisma schema** (File: `packages/database/prisma/schema.prisma`)
- Action: Define the complete data model in Prisma:
  ```
  Key tables:
  - users (id, email, passwordHash, role, firstName, lastName, phone, companyName, kycStatus, avatarUrl, createdAt, updatedAt)
  - shipper_profiles (userId FK, companyAddress, businessLicense, insuranceDoc, verified)
  - carrier_profiles (userId FK, usdotNumber, mcNumber, insuranceExpiry, licenseNumber, licenseExpiry, preferredLanes JSONB, verified)
  - vehicles (id, carrierId FK, type, make, model, year, licensePlate, capacityTons, vin, insuranceExpiry, active)
  - loads (id, shipperId FK, origin JSONB{address,lat,lng}, destination JSONB{address,lat,lng}, equipmentType, weightLbs, dimensions JSONB, pickupWindowStart, pickupWindowEnd, deliveryWindowStart, deliveryWindowEnd, description, specialInstructions, budgetMin, budgetMax, status, instantBookPrice, createdAt, updatedAt)
  - bids (id, loadId FK, carrierId FK, amount, estimatedPickup, estimatedDelivery, notes, status, createdAt)
  - shipments (id, loadId FK unique, carrierId FK, shipperId FK, vehicleId FK nullable, acceptedBidId FK, agreedPrice, status, pickedUpAt, deliveredAt, createdAt, updatedAt)
  - shipment_events (id, shipmentId FK, status, latitude, longitude, notes, timestamp)
  - location_updates (id, shipmentId FK, carrierId FK, latitude, longitude, speed, heading, accuracy, timestamp) -- high volume, consider TimescaleDB later
  - documents (id, shipmentId FK nullable, userId FK, type, fileName, fileUrl, fileSize, mimeType, verified, createdAt)
  - payments (id, shipmentId FK, shipperId FK, carrierId FK, stripePaymentIntentId, amount, feeType, status, paidAt, createdAt)
  - invoices (id, shipmentId FK, invoiceNumber, lineItems JSONB, totalAmount, status, dueDate, paidAt, createdAt)
  - ratings (id, shipmentId FK, fromUserId FK, toUserId FK, score 1-5, comment, createdAt)
  - notifications (id, userId FK, type, title, body, data JSONB, read, readAt, createdAt)
  - refresh_tokens (id, userId FK, token, expiresAt, createdAt)
  ```
  Add indexes on: `loads.status`, `loads.shipperId`, `loads.equipmentType`, `bids.loadId`, `bids.carrierId`, `shipments.carrierId`, `shipments.status`, `location_updates.shipmentId + timestamp`, `payments.shipmentId`, `ratings.toUserId`.
- Why: The database is the foundation. Getting the schema right early prevents costly migrations later. Prisma provides type-safe queries and migration management.
- Dependencies: Steps 1.4, 1.7
- Risk: Medium -- schema changes are inevitable but Prisma migrations handle this well

**1.11 Generate initial migration and seed data** (Files: `packages/database/prisma/migrations/`, `packages/database/prisma/seed.ts`)
- Action: Run `prisma migrate dev` to generate the initial SQL migration. Write seed script that creates: 2 shipper users, 3 carrier users, 1 dispatcher, 1 admin, 5 vehicles, 10 sample loads (various statuses), 8 bids, 3 active shipments with location history, sample documents and payments. Use bcrypt for password hashing in seeds.
- Why: Seed data enables frontend development in parallel with backend. Developers can immediately see realistic data in the UI.
- Dependencies: Step 1.10
- Risk: Low

#### Week 3: API Gateway & Authentication Service

**1.12 Scaffold API Gateway with NestJS** (File: `services/api-gateway/`)
- Action: Initialize NestJS project. Configure Express adapter. Set up modules for: `ConfigModule` (loads .env), `HealthModule` (liveness + readiness endpoints), `LoggerModule` (structured JSON logging with correlation IDs). Add global exception filter that returns consistent `ApiResponse` envelope on errors. Add request logging middleware. Add Helmet for security headers. Add CORS configuration for web and mobile origins.
- Why: The gateway is the single entry point. It must be robust and consistent from the start.
- Dependencies: Steps 1.1, 1.3
- Risk: Low

**1.13 Implement JWT authentication middleware** (File: `services/api-gateway/src/middleware/auth.middleware.ts`)
- Action: Create middleware that extracts Bearer token from Authorization header, verifies JWT signature using RS256 with Keycloak public key (or HS256 with JWT_SECRET for simpler initial setup), and attaches decoded payload `{ userId, email, role }` to the request object. Create `@Public()` decorator for unauthenticated routes. Create `@Roles(Role.SHIPPER, Role.ADMIN)` decorator for role checks. Implement token refresh endpoint.
- Why: Every subsequent endpoint depends on authentication. Getting this right first enables all role-based features.
- Dependencies: Step 1.12
- Risk: Medium -- JWT verification must be correct; test with expired/malformed/missing tokens

**1.14 Implement rate limiting** (File: `services/api-gateway/src/middleware/rate-limiter.ts`)
- Action: Use `@nestjs/throttler` or a Redis-backed rate limiter. Configure: 100 requests/minute for authenticated users, 20 requests/minute for unauthenticated (login/register), 5 requests/minute for payment webhooks. Return 429 with Retry-After header.
- Why: Prevents abuse. Required for production security.
- Dependencies: Steps 1.4 (Redis), 1.12
- Risk: Low

**1.15 Build User/Auth Service** (File: `services/user-service/`)
- Action: Implement:
  - `POST /auth/register` -- validate input (Zod schema), check email uniqueness, hash password (bcrypt, 12 rounds), create user with role, return JWT pair (access + refresh)
  - `POST /auth/login` -- validate credentials, check password, return JWT pair
  - `POST /auth/refresh` -- validate refresh token, issue new pair, rotate refresh token
  - `POST /auth/verify-email` -- verify email with token (SendGrid link)
  - `GET /users/me` -- return current user profile
  - `PUT /users/me` -- update profile (name, phone, company)
  - `POST /users/me/kyc` -- upload KYC documents (license, insurance) to S3, update kycStatus to PENDING
  - `GET /users/:id/public` -- public profile (name, rating, verified status) for viewing carriers/shippers
- Why: Authentication is the prerequisite for every other feature. KYC flow is critical for trust in a freight marketplace.
- Dependencies: Steps 1.10, 1.12, 1.13
- Risk: Medium -- password hashing, token rotation, and email verification must be secure

**1.16 Write unit and integration tests for auth** (Files: `services/user-service/test/`, `services/api-gateway/test/`)
- Action: Write tests covering: successful registration (all 4 roles), duplicate email rejection, login with correct/incorrect credentials, JWT verification (valid/expired/malformed), role-based access (carrier cannot access shipper endpoints), token refresh flow, rate limiting. Use Jest with supertest for HTTP tests. Mock Prisma for unit tests; use test database for integration tests.
- Why: Auth bugs are security vulnerabilities. 100% coverage on auth is non-negotiable.
- Dependencies: Steps 1.13, 1.15
- Risk: Low

#### Week 4: Infrastructure Templates & Design Handoff

**1.17 Create Terraform infrastructure templates** (File: `infrastructure/terraform/`)
- Action: Write Terraform modules for:
  - `main.tf`: AWS provider, S3 backend for state, region variable
  - `vpc.tf`: VPC with public/private subnets across 2 AZs, NAT gateway, internet gateway
  - `rds.tf`: PostgreSQL 16 on RDS (db.t3.medium, multi-AZ, encrypted, automated backups)
  - `elasticache.tf`: Redis 7 cluster (cache.t3.micro, single node for staging)
  - `s3.tf`: Bucket for document uploads with server-side encryption, lifecycle rules, CORS for direct uploads
  - `ecs.tf`: ECS Fargate cluster, task definitions for each service, auto-scaling policies
  - `alb.tf`: Application Load Balancer with HTTPS listener, target groups per service, health checks
  - `variables.tf`: Environment-specific variables (staging vs production)
  - Output the connection strings and ARNs needed by services.
- Why: Infrastructure-as-Code ensures reproducible environments. Terraform state tracks what exists in AWS.
- Dependencies: None (can be done in parallel with code)
- Risk: Medium -- AWS configuration has many knobs; validate with `terraform plan` frequently

**1.18 Create Dockerfile templates** (Files: `docker/Dockerfile.service`, `docker/Dockerfile.web`)
- Action: Write multi-stage Dockerfiles:
  - `Dockerfile.service`: Stage 1 (builder) - pnpm install + build with Turborepo prune. Stage 2 (runner) - Alpine Node 20, copy only dist + node_modules, run as non-root user, health check.
  - `Dockerfile.web`: Stage 1 (builder) - Next.js standalone build. Stage 2 (runner) - Alpine Node 20, copy standalone output.
  - Target image size under 150MB per service.
- Why: Small, secure images. Multi-stage builds prevent leaking source code or dev dependencies into production.
- Dependencies: Step 1.12
- Risk: Low

**1.19 Create OpenAPI/Swagger specification** (File: `services/api-gateway/src/swagger.ts` or standalone `docs/openapi.yaml`)
- Action: Configure Swagger via `@nestjs/swagger` decorators on all controllers. Document every endpoint with: description, request body schema, response schema, auth requirements, error responses. Group by tag (Auth, Loads, Bids, Shipments, Vehicles, Documents, Payments, Ratings, Admin). Set up Swagger UI at `/api/docs` in development.
- Why: API documentation is the contract between backend and frontend teams. Enables parallel development.
- Dependencies: Steps 1.12, 1.15
- Risk: Low

**1.20 Produce wireframes and UI/UX design assets** (No code file -- design deliverable)
- Action: Using Figma (or similar), produce:
  - Shipper portal wireframes: login, dashboard, create load form, load list, load detail with bids, shipment tracking map, payment history, ratings
  - Dispatcher dashboard wireframes: fleet map, assignment board, driver list, compliance view
  - Admin dashboard wireframes: KPIs, user management table, all shipments, analytics
  - Mobile app wireframes: onboarding, load board, load detail, active shipment with navigation, status update, POD camera capture, payment history, profile
  - Design system: color palette, typography, component library (buttons, cards, forms, tables, badges, maps)
- Why: Visual designs must be finalized before frontend coding begins to avoid rework.
- Dependencies: None (parallel with engineering)
- Risk: Medium -- design iteration may extend Phase 1

---

### Phase 1 Exit Criteria
- [ ] Monorepo builds with `turbo build` (zero errors)
- [ ] CI pipeline runs lint, typecheck, test on every PR
- [ ] Docker Compose brings up PostgreSQL, Redis, Keycloak locally
- [ ] Database migrations apply cleanly; seed data loads
- [ ] `POST /auth/register` and `POST /auth/login` work for all 4 roles
- [ ] JWT auth middleware correctly gates protected endpoints
- [ ] Swagger docs accessible at `/api/docs`
- [ ] Terraform `plan` succeeds for staging environment
- [ ] Wireframes approved for all 4 user interfaces

---

### Phase 2: Core Development (May 4 -- July 26, 2026) -- 12 weeks

Phase 2 is the heaviest engineering phase. It builds out the remaining 6 microservices, the complete web application, and the driver mobile app. This phase is divided into 4 sub-phases to manage complexity.

#### Phase 2A: Load & Bid Services (Weeks 5-6)

**2.1 Build Load Management in Matching Service** (File: `services/matching-service/src/`)
- Action: Implement load CRUD:
  - `POST /loads` (shipper only) -- validate with `createLoadSchema`, geocode origin/destination via Google Maps Geocoding API if lat/lng not provided, save with status AVAILABLE
  - `GET /loads` (shipper) -- list own loads with pagination, filtering by status
  - `GET /loads/:id` (authenticated) -- full load detail including bid count
  - `PUT /loads/:id` (shipper, owner only) -- update load (only if status is DRAFT or AVAILABLE)
  - `DELETE /loads/:id` (shipper, owner only) -- soft delete / cancel (only if no accepted bids)
  - `GET /loads/available` (carrier) -- browse available loads with filters (equipment type, origin radius, destination radius, weight range, date range), sorted by match score
- Why: Load posting is the start of the entire value chain. Without loads, nothing else functions.
- Dependencies: Steps 1.10, 1.12, 1.13
- Risk: Medium -- geocoding API integration and search filtering logic need thorough testing

**2.2 Implement rule-based matching engine** (File: `services/matching-service/src/algorithms/`)
- Action: Create scoring algorithm in `score-calculator.ts`:
  - Equipment match (binary: 0 or 1 -- must match)
  - Distance score: how close is the carrier's current location (or preferred lanes) to the load origin? Closer = higher score
  - Weight compatibility: carrier vehicle capacity vs load weight
  - Rating score: carrier's average rating (normalized 0-1)
  - History score: has the carrier successfully completed loads on this lane before?
  - Combine with weighted sum (configurable weights via env/config)
  
  Create `filter-engine.ts` for pre-filtering:
  - Exclude carriers with expired insurance/license
  - Exclude carriers without matching equipment
  - Exclude carriers who are currently on an active shipment (unless multi-truck fleet)
  - Apply carrier's preferred lane preferences
  
  Expose via `GET /loads/available?lat=X&lng=Y` which returns loads sorted by match score for the requesting carrier.
- Why: Matching quality directly impacts marketplace liquidity. Even a simple algorithm is better than no matching.
- Dependencies: Step 2.1
- Risk: Medium -- algorithm tuning will be iterative; start simple, measure, improve

**2.3 Build Bid Management** (File: `services/matching-service/src/controllers/bid.controller.ts`)
- Action: Implement:
  - `POST /loads/:id/bid` (carrier) -- validate bid amount, check load is AVAILABLE, check carrier is verified, prevent duplicate bids from same carrier, save bid with status PENDING
  - `GET /loads/:id/bids` (shipper who owns load, or admin) -- list all bids for a load, sorted by amount ascending, include carrier public profile and rating
  - `PUT /bids/:id/accept` (shipper) -- accept bid, reject all other bids for that load, change load status to BOOKED, trigger shipment creation (calls dispatch-service), send notifications to winning and losing carriers
  - `PUT /bids/:id/reject` (shipper) -- reject specific bid
  - `PUT /bids/:id/withdraw` (carrier who placed bid) -- withdraw own bid
  - Instant Book: if load has `instantBookPrice`, carrier can `POST /loads/:id/accept` at that price (creates bid + auto-accepts)
- Why: Bidding is the marketplace mechanism. It must handle concurrency (two carriers accepting simultaneously) correctly.
- Dependencies: Step 2.1
- Risk: High -- race conditions on bid acceptance require database-level locking or optimistic concurrency

**2.4 Write tests for load and bid services** (File: `services/matching-service/test/`)
- Action: Unit tests for matching algorithm (various carrier profiles vs loads). Integration tests for: create load, list loads, bid on load, accept bid (verify other bids rejected), instant book, prevent double-booking, carrier cannot bid on own load, shipper cannot bid. Test concurrent bid acceptance with parallel requests.
- Why: Marketplace integrity depends on correct bid handling.
- Dependencies: Steps 2.1, 2.2, 2.3
- Risk: Low

#### Phase 2B: Dispatch & Tracking Services (Weeks 7-8)

**2.5 Build Dispatch Service** (File: `services/dispatch-service/src/`)
- Action: Implement:
  - Shipment creation (called internally when bid is accepted): create shipment record linking load, carrier, shipper, bid, agreed price, status PENDING_PICKUP
  - `GET /shipments` -- list shipments (filtered by role: carrier sees own, shipper sees own, dispatcher/admin sees all), with pagination and status filter
  - `GET /shipments/:id` -- full shipment detail including load, carrier, documents, events timeline
  - `PUT /shipments/:id/status` (carrier) -- update shipment status. Implement state machine:
    - PENDING_PICKUP -> PICKED_UP (requires location)
    - PICKED_UP -> IN_TRANSIT
    - IN_TRANSIT -> DELIVERED (requires location, triggers payment flow)
    - Any state -> CANCELLED (with reason, triggers notification)
    - Invalid transitions return 400 with explanation
  - `PUT /shipments/:id/assign` (dispatcher) -- reassign shipment to different driver
  - Each status change creates a `shipment_event` record and publishes to Redis pub/sub
- Why: The shipment state machine is the operational backbone. Every other system (tracking, payments, notifications) reacts to shipment state changes.
- Dependencies: Step 2.3 (bid acceptance creates shipment)
- Risk: High -- state machine must be bulletproof; invalid states corrupt business logic

**2.6 Implement shipment state machine with tests** (File: `services/dispatch-service/src/state-machine/shipment-states.ts`)
- Action: Define all valid transitions as a map: `{ [currentState]: allowedNextStates[] }`. Create `validateTransition(current, next)` function. Create `transitionShipment(shipmentId, newStatus, metadata)` function that: validates transition, updates DB in transaction, creates event record, publishes event to Redis channel `shipment:${id}:status`. Write exhaustive tests for every valid and invalid transition.
- Why: State machine bugs cause operational chaos (e.g., marking a shipment delivered before it's picked up).
- Dependencies: Step 2.5
- Risk: Medium

**2.7 Build Tracking Service with WebSocket** (File: `services/tracking-service/src/`)
- Action: Implement:
  - `POST /tracking/location` (carrier, from mobile app) -- receive GPS update (lat, lng, speed, heading, accuracy, timestamp), store in `location_updates` table, publish to Redis channel `shipment:${shipmentId}:location`
  - `GET /tracking/shipments/:id/locations` -- return location history for a shipment (with time range filter)
  - `GET /tracking/shipments/:id/latest` -- return latest known location
  - WebSocket gateway (`tracking.gateway.ts`): clients connect and subscribe to `shipment:${id}`. Server listens to Redis pub/sub channels and forwards location updates to connected clients. Authenticate WebSocket connections via JWT token in handshake query parameter.
  - Batch insert optimization: buffer incoming locations and bulk-insert every 5 seconds (to reduce DB write pressure at scale)
- Why: Real-time tracking is a headline feature. Shippers and dispatchers need to see live driver locations on the map.
- Dependencies: Steps 1.4 (Redis), 2.5
- Risk: High -- WebSocket connections at scale require careful resource management; location data volume can be very large

**2.8 Implement geofence detection** (File: `services/tracking-service/src/services/geofence.service.ts`)
- Action: When a location update arrives, check if the driver has entered a geofence around the pickup or delivery location (configurable radius, default 500 meters). If entered, fire a notification event (e.g., "Driver is approaching pickup location"). Store geofence events in `shipment_events`.
- Why: Automatic notifications when driver approaches reduce manual status updates and improve shipper experience.
- Dependencies: Step 2.7
- Risk: Low

**2.9 Write tests for dispatch and tracking** (Files: `services/dispatch-service/test/`, `services/tracking-service/test/`)
- Action: Test state machine transitions exhaustively. Test location ingestion (valid/invalid coordinates, out-of-order timestamps). Test WebSocket connection, subscription, and message delivery. Test geofence enter/exit detection. Load test location ingestion endpoint (target: 1000 updates/second).
- Dependencies: Steps 2.5-2.8
- Risk: Low

#### Phase 2C: Payment, Notification, and Document Services (Weeks 9-10)

**2.10 Build Payment Service with Stripe** (File: `services/payment-service/src/`)
- Action: Implement:
  - `POST /payments/create-intent` (internal, called when shipment delivered) -- create Stripe PaymentIntent for the agreed price, store payment record with status PENDING
  - `POST /payments/charge` (shipper) -- confirm payment (uses Stripe hosted checkout or client-side confirmation)
  - `GET /payments` (carrier: own payments; shipper: own payments; admin: all) -- payment history with status
  - `GET /payments/:id` -- payment detail including fee breakdown (linehaul, detention, lumper)
  - Stripe webhook handler (`POST /webhooks/stripe`):
    - Verify webhook signature (CRITICAL)
    - Handle `payment_intent.succeeded` -- update payment status to COMPLETED, notify carrier
    - Handle `payment_intent.payment_failed` -- update status to FAILED, notify shipper
    - Handle `charge.refunded` -- handle refund flow
    - Idempotent processing (check if event already processed by storing Stripe event IDs)
  - Invoice generation: on shipment delivery, generate invoice with line items (linehaul rate, any accessorial fees), store invoice record, generate PDF (using a library like `pdfkit` or `@react-pdf/renderer`)
  - `GET /invoices/:id/pdf` -- download invoice PDF
- Why: Payments are the revenue engine. Stripe handles PCI compliance; we handle the business logic around invoicing and fee breakdown.
- Dependencies: Steps 2.5 (shipment delivery triggers payment)
- Risk: High -- payment bugs lose money; webhook signature verification is critical; must handle idempotency

**2.11 Build Notification Service** (File: `services/notification-service/src/`)
- Action: Implement:
  - Internal event listener: subscribe to Redis pub/sub channels for shipment status changes, bid events, payment events. On each event, determine which users to notify and which channels (push, email, SMS, in-app).
  - `POST /notifications/send` (internal) -- send notification to user via specified channels
  - `GET /notifications` (authenticated) -- list user's notifications with pagination, unread count
  - `PUT /notifications/:id/read` -- mark notification as read
  - `PUT /notifications/read-all` -- mark all as read
  - Email service (`email.service.ts`): SendGrid integration with Handlebars templates for: booking confirmed, status update, payment received, document requested, bid accepted/rejected
  - Push service (`push.service.ts`): Firebase Cloud Messaging. Store FCM device tokens per user. Send targeted push notifications.
  - SMS service (`sms.service.ts`): Twilio for critical alerts (e.g., shipment cancelled, payment failed). Only for opt-in users.
  - Notification routing rules:
    - Bid received: in-app + email to shipper
    - Bid accepted: push + email to carrier
    - Status change: push to shipper + dispatcher; in-app for all
    - Payment completed: push + email to carrier
    - Document requested: push + email to carrier
- Why: Notifications keep all parties informed and drive engagement. Multi-channel ensures messages are received.
- Dependencies: Steps 1.4 (Redis), 2.5, 2.10
- Risk: Medium -- FCM and SendGrid require API keys and proper configuration; template rendering must be tested

**2.12 Build Document Upload with S3** (File: integrated across services, primarily `services/api-gateway/src/routes/document.routes.ts`)
- Action: Implement:
  - `POST /documents/presigned-url` (authenticated) -- generate S3 presigned upload URL (valid 15 minutes, max 10MB, allowed types: image/jpeg, image/png, application/pdf). Return presigned URL + document ID.
  - Client uploads directly to S3 using presigned URL (avoids gateway bandwidth bottleneck)
  - `POST /documents/confirm` -- client confirms upload complete, service verifies file exists in S3, saves document record (shipmentId, userId, type, fileName, fileUrl, fileSize, mimeType)
  - `GET /documents?shipmentId=X` -- list documents for a shipment
  - `GET /documents/:id` -- get document detail with download URL (presigned, time-limited)
  - `DELETE /documents/:id` (owner or admin only)
  - Document type enforcement: POD required before shipment can be marked DELIVERED; BOL can be attached at any time
- Why: Document management (POD, BOL, receipts) is legally required in freight. S3 presigned URLs are the secure, scalable pattern.
- Dependencies: Step 1.17 (S3 bucket)
- Risk: Medium -- presigned URL expiration, file size limits, and CORS configuration need careful handling

**2.13 Build Rating System** (File: `services/dispatch-service/src/` or separate controller in API gateway)
- Action: Implement:
  - `POST /shipments/:id/rate` (authenticated) -- submit rating (1-5 stars, optional comment). Validate: shipment must be DELIVERED, rater must be shipper or carrier on this shipment, each party can rate only once per shipment.
  - `GET /users/:id/ratings` -- list ratings received by a user with pagination
  - `GET /users/:id/rating-summary` -- average score, total count, distribution (1-star: N, 2-star: N, etc.)
  - Update user's cached average rating on each new rating (denormalized field on user profile for fast reads)
  - Mutual rating enforcement: optionally hide ratings until both parties have rated (to prevent retaliation)
- Why: Ratings build marketplace trust. Uber Freight's million+ reviews demonstrate the importance of this feature.
- Dependencies: Step 2.5 (shipment must exist and be delivered)
- Risk: Low

**2.14 Write tests for payment, notification, document, and rating services** (Files: `services/payment-service/test/`, `services/notification-service/test/`)
- Action: Payment tests: mock Stripe API, test intent creation, webhook handling (all event types), idempotency, invoice generation. Notification tests: mock SendGrid/FCM/Twilio, test routing rules, test in-app notification CRUD. Document tests: mock S3 presigned URL generation, test upload confirmation, test authorization. Rating tests: test valid/invalid ratings, duplicate prevention, average calculation.
- Dependencies: Steps 2.10-2.13
- Risk: Low

#### Phase 2D: Web & Mobile Frontends (Weeks 7-12, parallel with backend)

**2.15 Scaffold Next.js web application** (File: `apps/web/`)
- Action: Initialize Next.js 14+ with App Router, TypeScript, Tailwind CSS, Shadcn/UI. Configure: `next.config.js` (environment variables, image domains for S3), `tailwind.config.ts` (custom colors for brand, extend theme), Zustand for state management, Axios for API calls with interceptor for JWT refresh. Set up layout structure: `(auth)` group for login/register (no sidebar), `(shipper)`, `(dispatcher)`, `(admin)` groups with role-specific sidebar layouts. Implement route guards: redirect unauthenticated users to login; redirect users to their role-appropriate dashboard.
- Why: The web app serves 3 of 4 user roles. Next.js App Router provides server components, layouts, and file-based routing.
- Dependencies: Steps 1.7 (shared types), 1.19 (API docs)
- Risk: Low

**2.16 Build authentication pages** (Files: `apps/web/src/app/(auth)/login/page.tsx`, `register/page.tsx`)
- Action: Build:
  - Login page: email + password form, "Remember me" checkbox, forgot password link, role-aware redirect after login
  - Register page: multi-step form (Step 1: email, password, role selection; Step 2: personal/company details; Step 3: document upload for carriers). Form validation using shared Zod schemas. Error display with toast notifications.
  - Auth store (Zustand): store tokens in httpOnly cookies (for SSR) or localStorage (for SPA), auto-refresh before expiry, logout clears tokens
- Why: Auth pages are the first thing users see. They must be polished and error-free.
- Dependencies: Steps 1.15 (auth API), 2.15
- Risk: Low

**2.17 Build Shipper Dashboard and Load Management** (Files: `apps/web/src/app/(shipper)/`)
- Action: Build:
  - Dashboard (`dashboard/page.tsx`): summary cards (active loads, pending bids, in-transit shipments, recent payments), recent activity feed
  - Create Load form (`loads/new/page.tsx`): multi-section form with origin/destination address autocomplete (Google Maps Places API), equipment type dropdown, weight/dimensions inputs, date pickers for pickup/delivery windows, budget range slider, special instructions textarea. Preview route on map before submission.
  - My Loads list (`loads/page.tsx`): filterable/sortable table with status badges, bid count, actions (view, edit, cancel)
  - Load Detail (`loads/[id]/page.tsx`): load info card, list of bids with carrier profiles and ratings, accept/reject bid buttons, real-time bid count update via WebSocket
  - Load Tracking (`loads/[id]/track/page.tsx`): Google Maps with live driver location marker (WebSocket), route polyline, ETA display, shipment event timeline
- Why: This is the primary shipper workflow. Post -> Review Bids -> Track -> Pay.
- Dependencies: Steps 2.1, 2.3, 2.7 (APIs), 2.15
- Risk: Medium -- Google Maps integration requires API key management and can be complex

**2.18 Build Shipper Shipments, Payments, and Ratings pages** (Files: `apps/web/src/app/(shipper)/shipments/`, `payments/`)
- Action: Build:
  - Active Shipments (`shipments/page.tsx`): list of active shipments with status badges, driver info, ETA, link to tracking map
  - Shipment Detail (`shipments/[id]/page.tsx`): timeline of status events, uploaded documents viewer (with download), route map, carrier info card, payment status, rating form (after delivery)
  - Payment History (`payments/page.tsx`): table of all payments with status, amount, date. Filter by status. Link to invoice PDF download.
  - Invoice viewer component: display line items (linehaul, fees), total, payment status, "Pay Now" button that triggers Stripe checkout
- Dependencies: Steps 2.5, 2.10, 2.12, 2.13 (APIs)
- Risk: Medium -- Stripe checkout integration on frontend needs careful implementation

**2.19 Build Dispatcher Dashboard** (Files: `apps/web/src/app/(dispatcher)/`)
- Action: Build:
  - Fleet Overview (`dashboard/page.tsx`): full-screen Google Map showing all active drivers as markers (color-coded by status: idle, en-route, at-pickup, at-delivery). Click marker to see driver details and current shipment.
  - Assignment Board (`assignments/page.tsx`): Kanban-style board or table showing loads that need assignment. Drag-and-drop (or dropdown) to assign driver. Show driver availability, current location, equipment.
  - Driver List (`drivers/page.tsx`): table of all drivers in the fleet with status, current load, location, rating, compliance status (green/red for docs expiry)
  - Compliance View (`compliance/page.tsx`): list drivers with expiring documents (insurance, license), HOS status if available
- Why: Dispatchers need operational tools to manage multiple drivers and loads simultaneously.
- Dependencies: Steps 2.7 (tracking), 2.5 (shipments), 2.15
- Risk: Medium -- real-time fleet map with many markers needs performance optimization

**2.20 Build Admin Dashboard** (Files: `apps/web/src/app/(admin)/`)
- Action: Build:
  - Admin Dashboard (`dashboard/page.tsx`): KPI cards (total loads, active shipments, revenue this month, average match time, on-time delivery rate). Charts using Recharts or Chart.js (load volume trend, revenue trend, loads by equipment type).
  - User Management (`users/page.tsx`): searchable/filterable table of all users. Actions: view profile, verify/reject KYC, suspend/activate account, reset password. Expandable rows showing user's loads/shipments.
  - All Shipments (`shipments/page.tsx`): master table of all shipments with filters (status, date range, shipper, carrier). Drill down to shipment detail.
  - All Payments (`payments/page.tsx`): payment ledger with totals, export to CSV
  - Analytics (`analytics/page.tsx`): advanced charts (lane heatmap, carrier performance ranking, average bid-to-book time, cancellation rate)
  - Settings (`settings/page.tsx`): platform configuration (commission rate, instant book settings, notification preferences)
- Why: Admin needs full visibility and control over the platform to ensure quality and compliance.
- Dependencies: All backend APIs
- Risk: Low -- mostly CRUD tables and charts; well-trodden patterns

**2.21 Scaffold React Native mobile app** (File: `apps/mobile/`)
- Action: Initialize React Native project with Expo (managed workflow for faster iteration) or bare workflow. Configure: TypeScript, React Navigation (stack + bottom tabs), Zustand for state, Axios with JWT refresh interceptor. Set up navigation structure: Auth Stack (Login, Register, Onboarding) and Main Tab Navigator (Load Board, Active Shipment, Documents, Payments, Profile). Install: `react-native-maps` (Google Maps), `expo-location` (GPS), `expo-camera` (POD photos), `expo-document-picker`, `expo-notifications` (FCM).
- Why: The driver app is critical -- drivers are mobile-first. React Native enables iOS + Android from one codebase.
- Dependencies: Steps 1.7, 1.19
- Risk: Medium -- React Native setup can have platform-specific issues; Expo simplifies but limits some native modules

**2.22 Build Mobile Auth and Onboarding** (Files: `apps/mobile/src/screens/auth/`)
- Action: Build:
  - Login screen: phone number or email + password, biometric login option (FaceID/fingerprint), remember me
  - Register screen: phone verification (Twilio SMS OTP), personal details, truck details (type, make, model, year, plate, capacity), document upload (license photo, insurance doc, USDOT number)
  - Onboarding screen: set preferred lanes (origin/destination regions), equipment type, availability hours, minimum price threshold
- Dependencies: Step 1.15 (auth API), 2.21
- Risk: Low

**2.23 Build Mobile Load Board** (Files: `apps/mobile/src/screens/loads/`)
- Action: Build:
  - Load Board screen: vertical scrollable list of available loads matching driver's preferences. Each card shows: origin city -> destination city, equipment type icon, weight, pickup date, price (or bid range), distance from current location. Pull-to-refresh. Filter button opening bottom sheet (equipment, date range, price range, distance).
  - Load Detail screen: full load info, route preview on map (origin pin, destination pin, route polyline), shipper profile with rating, "Place Bid" button (opens bid amount input) and "Instant Book" button (if available).
  - Load Map screen: map view of nearby available loads as pins. Tap pin to see load summary card. Navigate to detail.
- Dependencies: Steps 2.1, 2.2 (matching API), 2.21
- Risk: Medium -- map performance with many markers on mobile needs optimization (marker clustering)

**2.24 Build Mobile Active Shipment and Tracking** (Files: `apps/mobile/src/screens/active-shipment/`)
- Action: Build:
  - Active Shipment screen: shows current shipment details (load info, pickup/delivery addresses, timeline). Large status buttons: "Arrived at Pickup" -> "Picked Up" -> "In Transit" -> "Arrived at Delivery" -> "Delivered". Each button triggers status API call and updates UI.
  - Integrated navigation: "Navigate" button opens Google Maps / Apple Maps with destination address for turn-by-turn directions.
  - Background GPS tracking service (`services/location.ts`): when driver has an active shipment, start background location tracking. Send GPS updates to tracking service every 30 seconds (configurable). Handle: app in background, app killed (use `expo-task-manager`), battery optimization. Show persistent notification "Tracking active for shipment #123".
  - POD Upload screen: camera interface to take photo of signed delivery receipt. Option to pick from gallery. Upload to S3 via presigned URL. Mark document type as POD.
- Why: This is the driver's primary workflow during a shipment. Background tracking is essential for real-time visibility.
- Dependencies: Steps 2.5, 2.7, 2.12 (APIs), 2.21
- Risk: High -- background location tracking on both iOS and Android is notoriously tricky with OS battery restrictions

**2.25 Build Mobile Documents, Payments, and Profile** (Files: `apps/mobile/src/screens/documents/`, `payments/`, `profile/`)
- Action: Build:
  - Document List screen: list of all uploaded documents, organized by shipment. Status indicator (verified/pending). Upload button.
  - Document Upload screen: camera capture or file picker. Select document type (POD, BOL, Receipt, Other). Upload progress indicator.
  - Payment History screen: list of payments with status badges (Pending, Processing, Completed). Total earnings summary. Tap for detail (fee breakdown: linehaul, detention, lumper).
  - Profile screen: personal info, vehicle details (with edit), rating display, notification preferences, logout
  - Vehicle Management screen: add/edit/remove vehicles. Set active vehicle for current shipment.
  - Settings screen: preferred lanes, notification toggles, location tracking permissions
- Dependencies: Steps 2.10, 2.12, 2.13 (APIs), 2.21
- Risk: Low

**2.26 Implement offline queue for mobile** (File: `apps/mobile/src/services/offline-queue.ts`)
- Action: Create an offline-first queue that: detects network connectivity, queues failed API calls (status updates, location uploads, document uploads) in AsyncStorage, retries queued items when connectivity is restored (with exponential backoff), deduplicates by request signature, shows sync indicator in UI.
- Why: Drivers are often in areas with poor connectivity. Status updates and location data must not be lost.
- Dependencies: Step 2.21
- Risk: Medium -- conflict resolution (e.g., server state changed while offline) needs careful handling

---

### Phase 2 Exit Criteria
- [ ] All 7 microservices are running and communicating
- [ ] Complete load lifecycle works end-to-end: post -> bid -> book -> pickup -> transit -> deliver -> pay -> rate
- [ ] Shipper portal: can post loads, review bids, track shipments, view payments
- [ ] Dispatcher dashboard: can see fleet map, assign loads, view driver status
- [ ] Admin dashboard: can manage users, view KPIs, see all shipments and payments
- [ ] Mobile app: can browse loads, bid, update status, track location, upload POD, view payments
- [ ] WebSocket live tracking works (location updates appear on map within 2 seconds)
- [ ] Background GPS tracking works on iOS and Android
- [ ] All services have 80%+ unit test coverage
- [ ] API response times under 500ms for all endpoints

---

### Phase 3: Integration & Testing (July 27 -- September 13, 2026) -- 7 weeks

Phase 3 focuses on hardening the system: connecting all third-party services, comprehensive testing, performance optimization, and security review.

#### Phase 3A: Third-Party Integrations (Weeks 13-15)

**3.1 Complete Stripe integration with production configuration** (File: `services/payment-service/`)
- Action: Switch from Stripe test mode to production-ready configuration. Implement: Stripe Connect for carrier payouts (carriers onboard as connected accounts), direct payouts on delivery confirmation, handling of disputes/chargebacks, 3D Secure for high-value transactions. Test with Stripe CLI webhook forwarding. Configure webhook endpoints in Stripe dashboard. Implement retry logic for failed payout attempts.
- Why: Payment flow must work flawlessly in production. Stripe Connect enables platform-level payment splitting.
- Dependencies: Step 2.10
- Risk: High -- Stripe Connect onboarding flow is complex; payout timing and disputes need careful handling

**3.2 Complete Google Maps integration** (Files: `apps/web/src/lib/maps.ts`, `apps/mobile/src/services/maps.ts`)
- Action: Implement all Google Maps features:
  - Geocoding: convert addresses to lat/lng on load creation
  - Places Autocomplete: address suggestions in load creation form (web and mobile)
  - Directions API: calculate route, distance, and ETA between origin and destination
  - Distance Matrix API: batch distance calculations for matching engine (carrier location to multiple load origins)
  - Maps JavaScript API (web): render tracking map with custom markers, route polyline, info windows
  - Google Maps SDK (mobile via react-native-maps): similar map rendering on mobile
  - Truck-specific routing: use avoid=highways/tolls options where relevant; consider HERE API for truck-legal routing in future
  - API key security: restrict keys by HTTP referrer (web) and app package (mobile), set billing alerts
- Why: Maps are central to the user experience for tracking, route preview, and address entry.
- Dependencies: Steps 2.17, 2.19, 2.23, 2.24
- Risk: Medium -- API costs can escalate; implement caching for repeated geocoding/directions requests

**3.3 Integrate Firebase Cloud Messaging** (Files: `services/notification-service/src/services/push.service.ts`, `apps/mobile/src/services/push-notifications.ts`)
- Action: Set up Firebase project. Mobile: request notification permissions, obtain FCM token, send token to backend on login and token refresh. Backend: store FCM tokens per user (support multiple devices), send targeted push notifications using firebase-admin SDK. Handle: token invalidation (when user uninstalls or token expires), notification payload formatting (title, body, data for deep linking), notification categories (booking, status, payment). Test on both iOS and Android physical devices.
- Why: Push notifications are the primary way to reach drivers who may not have the app open.
- Dependencies: Steps 2.11, 2.21
- Risk: Medium -- iOS requires Apple Push Notification Service (APNs) certificate configuration via Firebase

**3.4 Integrate SendGrid for email** (File: `services/notification-service/src/services/email.service.ts`)
- Action: Configure SendGrid with verified sender domain. Create and test Handlebars email templates for: welcome email, email verification, booking confirmation, status update summary, payment receipt, weekly activity digest, document request. Implement email tracking (opens, clicks) via SendGrid webhooks. Handle bounces and unsubscribes.
- Why: Email is the fallback notification channel and required for transactional messages (invoices, receipts).
- Dependencies: Step 2.11
- Risk: Low

**3.5 Integrate Twilio for SMS** (File: `services/notification-service/src/services/sms.service.ts`)
- Action: Configure Twilio with verified phone number. Implement SMS sending for: OTP verification during registration, critical shipment alerts (cancellation, major delay), payment failure notification. Implement opt-in/opt-out (STOP/START). Rate limit SMS to prevent cost overruns. Log all SMS for compliance.
- Why: SMS reaches users who may not have data connectivity (common for truckers in rural areas).
- Dependencies: Step 2.11
- Risk: Low

#### Phase 3B: Comprehensive Testing (Weeks 15-18)

**3.6 End-to-end testing with Cypress (web)** (File: `apps/web/cypress/`)
- Action: Write E2E tests covering the 4 critical user journeys:
  1. Shipper journey: register -> post load -> receive bid -> accept bid -> track shipment -> approve payment -> rate carrier
  2. Carrier journey (via API, since web is for shippers): register -> verify -> bid on load -> (simulate status updates) -> upload POD -> receive payment -> rate shipper
  3. Dispatcher journey: login -> view fleet map -> assign load to driver -> monitor status changes
  4. Admin journey: login -> view KPIs -> manage user (verify, suspend) -> view all shipments -> export payments
  
  Set up Cypress with: API mocking for third parties (Stripe, Google Maps), test database seeding before each suite, visual regression testing for key pages, accessibility testing (axe-core plugin).
- Why: E2E tests catch integration bugs that unit tests miss. These 4 journeys represent the complete business value.
- Dependencies: Steps 2.15-2.20 (web app complete)
- Risk: Medium -- E2E tests are brittle and slow; invest in stable selectors (data-testid)

**3.7 End-to-end testing with Detox (mobile)** (File: `apps/mobile/e2e/`)
- Action: Write E2E tests for mobile:
  1. Driver registration and onboarding flow
  2. Load discovery, filtering, and bidding
  3. Active shipment workflow (pickup -> transit -> delivery with status updates)
  4. POD photo capture and upload
  5. Payment history viewing
  
  Set up Detox with: mock API server (MSW), test on both iOS simulator and Android emulator.
- Why: Mobile app bugs are harder to fix post-launch (app store review cycle). Test thoroughly.
- Dependencies: Steps 2.21-2.26 (mobile app complete)
- Risk: High -- Detox setup is complex; background location testing is particularly difficult to automate

**3.8 API integration tests** (File: `services/*/test/integration/`)
- Action: Write integration tests that test the full request path (HTTP -> controller -> service -> repository -> database) for every endpoint. Use a dedicated test database (seeded before each suite, torn down after). Test: authentication (valid/invalid/expired tokens), authorization (role-based access), input validation (missing fields, invalid types, boundary values), error responses (404, 409, 422, 500), pagination, filtering, sorting. Use supertest with the actual NestJS app instance.
- Why: Integration tests verify that all layers work together correctly.
- Dependencies: All backend services
- Risk: Low

**3.9 Load and performance testing** (File: `tests/load/`)
- Action: Use k6 or Artillery to simulate realistic load:
  - Scenario 1: 500 concurrent shippers posting loads, 2000 carriers browsing and bidding
  - Scenario 2: 1000 active shipments with drivers sending GPS updates every 30 seconds (33 location updates/second)
  - Scenario 3: 100 concurrent WebSocket connections subscribing to live tracking
  - Scenario 4: Payment processing under load (50 simultaneous payments)
  
  Measure: p50/p95/p99 response times, error rates, database connection pool usage, Redis memory, CPU/memory per service. Identify bottlenecks. Target: all API endpoints under 500ms p95 under normal load.
- Why: Freight platforms must handle spikes (e.g., Monday morning load postings). Performance issues destroy user trust.
- Dependencies: All backend services deployed to staging
- Risk: Medium -- may reveal architectural issues requiring significant refactoring

**3.10 Security audit and penetration testing** (File: `docs/security-audit.md`)
- Action: Conduct:
  - OWASP Top 10 review: SQL injection (Prisma parameterizes by default, verify), XSS (React escapes by default, verify raw HTML), CSRF (API is token-based, verify), broken auth (test token expiry, privilege escalation), insecure deserialization, security misconfiguration (CORS, headers)
  - Authentication testing: brute force login, JWT manipulation, token replay, privilege escalation (carrier accessing shipper endpoints)
  - Payment security: verify Stripe webhook signatures, test tampered amounts, verify PCI scope (we never touch card numbers)
  - File upload security: verify file type validation, prevent path traversal, scan for malware (optional: ClamAV)
  - Infrastructure: verify TLS configuration, check for exposed ports, verify S3 bucket is not public
  - Use SAST tools (ESLint security plugin, Snyk for dependency vulnerabilities)
- Why: Security breaches in a payment-processing platform are catastrophic for the business.
- Dependencies: All code complete
- Risk: High -- findings may require significant remediation

**3.11 Accessibility audit (web)** (File: `apps/web/`)
- Action: Run axe-core audit on all pages. Fix: missing alt text, color contrast issues, keyboard navigation, screen reader labels on interactive elements, form labels, focus management. Target WCAG 2.1 AA compliance.
- Why: Legal requirement in many jurisdictions; good UX practice.
- Dependencies: Step 2.15-2.20
- Risk: Low

#### Phase 3C: Performance Optimization (Week 18-19)

**3.12 Database query optimization** (File: `packages/database/`)
- Action: Analyze slow queries with `EXPLAIN ANALYZE`. Add missing indexes identified during load testing. Implement connection pooling (PgBouncer or Prisma connection pool). Consider read replicas for heavy read queries (load board search, analytics). Optimize N+1 queries in load listing (use Prisma `include` strategically). Add database query caching in Redis for frequently accessed data (available loads list, user profiles).
- Why: Database is typically the bottleneck. Proactive optimization prevents production emergencies.
- Dependencies: Step 3.9 (load testing results)
- Risk: Medium

**3.13 Frontend performance optimization** (Files: `apps/web/`, `apps/mobile/`)
- Action: Web: implement code splitting (Next.js does this by default per route), optimize images (next/image), lazy load below-fold components, add service worker for offline caching of static assets, minimize bundle size (analyze with `@next/bundle-analyzer`). Mobile: optimize list rendering (FlatList with keyExtractor, getItemLayout), reduce re-renders (React.memo, useMemo), optimize map performance (marker clustering for load map), implement image compression before upload.
- Why: Users abandon slow apps. Target: web LCP < 2.5s, mobile app launch < 2s.
- Dependencies: Steps 2.15-2.26
- Risk: Low

---

### Phase 3 Exit Criteria
- [ ] Stripe payments work end-to-end (charge shipper, payout carrier) in test mode
- [ ] Push notifications delivered on both iOS and Android
- [ ] Email notifications sent for all key events
- [ ] SMS OTP verification works for registration
- [ ] Google Maps: address autocomplete, route display, live tracking all functional
- [ ] All E2E test suites pass (web + mobile)
- [ ] All API integration tests pass
- [ ] Performance: all endpoints under 500ms p95 at expected load
- [ ] Security audit complete with no CRITICAL or HIGH findings unresolved
- [ ] 80%+ test coverage across all services

---

### Phase 4: Pilot & Launch (September 14 -- November 28, 2026) -- 11 weeks

#### Phase 4A: Staging Deployment & Beta Program (Weeks 20-23)

**4.1 Deploy to AWS staging environment** (File: `infrastructure/terraform/`)
- Action: Run `terraform apply` for staging environment. Deploy all services to ECS Fargate. Configure: RDS PostgreSQL with automated backups, ElastiCache Redis, S3 bucket with lifecycle rules, ALB with HTTPS (ACM certificate), CloudFront for web app. Configure environment variables in AWS Parameter Store / Secrets Manager. Run database migrations. Verify all services healthy. Run smoke tests against staging.
- Why: Staging environment validates the entire deployment pipeline before production.
- Dependencies: Steps 1.17, all code complete
- Risk: Medium -- AWS configuration issues are common; budget several days for troubleshooting

**4.2 Set up monitoring and alerting** (File: `infrastructure/monitoring/`)
- Action: Deploy:
  - Prometheus: scrape metrics from all services (HTTP request duration, error rate, active connections, DB query duration, Redis operations)
  - Grafana: dashboards for each service, overall system health, business metrics (loads posted, bids, payments). Create alert rules: error rate > 5%, p95 latency > 1s, service health check fail, disk usage > 80%, memory > 90%.
  - Sentry: error tracking for web and mobile apps. Configure source maps for meaningful stack traces.
  - AWS CloudWatch: aggregate logs from all ECS tasks. Set up log-based alerts for ERROR level.
  - PagerDuty or Slack integration for alert routing.
- Why: You cannot manage what you cannot measure. Monitoring is essential for production operations.
- Dependencies: Step 4.1
- Risk: Low

**4.3 Configure CI/CD deployment pipelines** (Files: `.github/workflows/deploy-staging.yml`, `deploy-production.yml`)
- Action: Create GitHub Actions workflows:
  - On merge to `develop`: build Docker images, push to ECR, deploy to ECS staging (rolling update), run smoke tests, notify Slack
  - On merge to `main` (manual approval gate): build, push, deploy to ECS production (blue-green deployment), run smoke tests, notify Slack, auto-rollback if health check fails within 5 minutes
  - Database migration step: run `prisma migrate deploy` as a one-off ECS task before deploying new service versions
- Why: Automated, reliable deployments with rollback capability.
- Dependencies: Steps 4.1, 1.5
- Risk: Medium -- blue-green deployment configuration with ECS requires careful setup

**4.4 Beta program with select users** (No code file -- operational)
- Action: Recruit 5-10 shippers and 20-30 carriers for closed beta. Provide: onboarding guide, direct support channel (Slack or WhatsApp group), feedback form (Google Forms or in-app survey). Track: bugs reported, feature requests, NPS score, load-to-book conversion rate, average time in each shipment status. Run beta for 4 weeks. Fix critical bugs within 24 hours. Prioritize UX feedback for Phase 4B.
- Why: Real users find bugs and UX issues that testing cannot. Beta validates product-market fit before public launch.
- Dependencies: Steps 4.1, 4.2
- Risk: Medium -- early users may encounter frustrating bugs; responsive support is critical

#### Phase 4B: Iteration & Polish (Weeks 24-26)

**4.5 Bug fixes and UX improvements from beta feedback** (Various files)
- Action: Triage all beta feedback. Fix all critical and high-severity bugs. Implement top 5-10 UX improvements (based on frequency of feedback). Common expected items: form flow improvements, notification frequency tuning, load board filter refinements, payment status clarity improvements, mobile app performance on older devices.
- Why: Beta feedback directly reflects real user needs.
- Dependencies: Step 4.4
- Risk: Low

**4.6 Production environment deployment** (File: `infrastructure/terraform/`)
- Action: Create production Terraform workspace. Deploy with: multi-AZ RDS (db.r6g.large), Redis cluster with replication, ECS with auto-scaling (min 2, max 10 tasks per service), ALB with WAF, CloudFront with custom domain and HTTPS. Configure: automated daily database backups with 30-day retention, S3 cross-region replication for documents, CloudWatch log retention (90 days). DNS configuration for production domain. SSL certificate via ACM.
- Why: Production environment must be highly available and secure.
- Dependencies: Steps 4.1, 4.3
- Risk: Medium -- production sizing and cost management

**4.7 App store submission** (File: `apps/mobile/`)
- Action: Prepare for Apple App Store and Google Play Store:
  - App Store: screenshots (6.5" and 5.5"), app description, privacy policy URL, app review notes (test account credentials), age rating, export compliance
  - Play Store: feature graphic, screenshots, short/long description, content rating questionnaire, data safety form
  - Both: app signing keys, versioning (1.0.0), crash-free rate targets
  - Submit for review. Budget 1-2 weeks for potential rejections and resubmission.
- Why: App store approval is a hard blocker for mobile launch.
- Dependencies: Step 4.5 (bugs fixed)
- Risk: High -- Apple review can reject for unexpected reasons; plan for iteration

#### Phase 4C: Launch (Weeks 27-28)

**4.8 Production launch** (Operational)
- Action: 
  - Enable production Stripe account (complete verification)
  - Switch all API keys to production (Google Maps, SendGrid, Twilio, FCM)
  - Run final smoke tests on production
  - Enable monitoring alerts
  - Set up on-call rotation (24/7 for first 2 weeks)
  - Launch web app at production domain
  - Publish mobile app (once app store approvals clear)
  - Send launch emails to beta users
  - Monitor dashboards closely for first 48 hours
- Why: Coordinated launch ensures nothing is missed.
- Dependencies: Steps 4.6, 4.7
- Risk: Medium -- production issues under real load

**4.9 Post-launch monitoring and rapid response** (Operational)
- Action: For the first 2 weeks after launch: daily standups focused on production issues, monitor error rates and latency closely, respond to user-reported bugs within 4 hours, deploy hotfixes via expedited pipeline (skip staging for critical fixes, with code review). Track KPIs: user registrations, loads posted, bids placed, shipments completed, payment success rate, app crash rate.
- Why: The launch period is when most critical issues surface.
- Dependencies: Step 4.8
- Risk: Medium

---

### Phase 4 Exit Criteria
- [ ] Staging environment fully operational with monitoring
- [ ] Beta program completed with positive NPS (>30)
- [ ] All critical and high-severity bugs from beta resolved
- [ ] Production environment deployed and passing health checks
- [ ] Mobile app approved on both App Store and Play Store
- [ ] Stripe production account verified and processing payments
- [ ] Monitoring dashboards showing healthy metrics
- [ ] On-call rotation established
- [ ] First 10 real shipments completed successfully on production

---

## Critical Path

The following dependency chain represents the longest path through the project and determines the minimum timeline:

```
1.1 Monorepo setup
  -> 1.10 Prisma schema
    -> 1.11 Migrations + seed
      -> 1.15 Auth service
        -> 2.1 Load service
          -> 2.3 Bid service
            -> 2.5 Dispatch service (shipment creation on bid accept)
              -> 2.7 Tracking service (needs active shipments)
                -> 2.10 Payment service (triggers on delivery)
                  -> 3.1 Stripe production config
                    -> 4.1 Staging deployment
                      -> 4.4 Beta program
                        -> 4.8 Production launch
```

Parallel tracks that can run concurrently with the critical path:
- **Frontend development** (steps 2.15-2.20) can start as soon as API contracts (Swagger docs) are defined, using mock data
- **Mobile development** (steps 2.21-2.26) same as above
- **Infrastructure/Terraform** (step 1.17) can be developed any time
- **Design/UX** (step 1.20) should complete before frontend coding begins
- **Notification service** (step 2.11) can develop in parallel with dispatch service
- **Third-party integrations** (steps 3.2-3.5) can proceed as soon as relevant services exist

## Risks & Mitigations

### Phase 1 Risks

- **Risk**: Prisma schema requires significant revision mid-project
  - Mitigation: Conduct thorough data model review with domain experts before generating migrations. Prisma migrations handle schema evolution well, but table renames and data migrations are disruptive.

- **Risk**: Keycloak configuration complexity delays auth
  - Mitigation: Start with simple JWT (HS256 with shared secret) for development. Migrate to Keycloak/RS256 in Phase 3 when security hardening begins. The auth middleware abstraction makes this swap transparent.

### Phase 2 Risks

- **Risk**: Race condition on bid acceptance (two shippers accepting simultaneously, or two carriers instant-booking)
  - Mitigation: Use PostgreSQL advisory locks or serializable transactions when accepting bids. Test with concurrent request simulations.

- **Risk**: Background GPS tracking drains battery or is killed by OS
  - Mitigation: Use Expo TaskManager with appropriate battery optimization settings. Fall back to significant location changes if continuous tracking fails. Test extensively on real devices (not just simulators).

- **Risk**: WebSocket connections do not scale beyond staging loads
  - Mitigation: Use Redis pub/sub as the message broker so any gateway instance can serve any subscription. Implement connection limits and graceful degradation (fall back to polling).

- **Risk**: Frontend development blocked by incomplete backend APIs
  - Mitigation: Define OpenAPI spec in Phase 1 step 1.19. Frontend can mock APIs using MSW (Mock Service Worker) and develop in parallel.

### Phase 3 Risks

- **Risk**: Stripe Connect carrier onboarding is complex and has regulatory requirements
  - Mitigation: Start with simple direct charges in Phase 2 (shipper pays platform, platform manually pays carrier). Implement Stripe Connect in Phase 3 once the basic flow works.

- **Risk**: Google Maps API costs escalate during testing
  - Mitigation: Use mock data for development/testing. Implement server-side caching for geocoding results. Set billing alerts at $100 and $500. Use Google Maps Platform free tier ($200/month credit) during development.

- **Risk**: Performance testing reveals database bottlenecks
  - Mitigation: Design for horizontal scaling from the start (stateless services, connection pooling). Budget 2 weeks in Phase 3 for optimization based on load test results.

- **Risk**: Security audit reveals fundamental architectural issues
  - Mitigation: Follow security best practices from day one (parameterized queries, input validation, no raw SQL, JWT verification). The audit should find edge cases, not foundational flaws.

### Phase 4 Risks

- **Risk**: Apple App Store rejects the mobile app
  - Mitigation: Review Apple's guidelines carefully before submission. Common rejection reasons: incomplete functionality, crashes, privacy policy missing, background location justification. Submit early (week 24) to allow time for iteration.

- **Risk**: Beta users find the platform unreliable and lose trust
  - Mitigation: Heavily test before beta. Have a direct support channel. Fix critical bugs within 24 hours. Set expectations that it is a beta.

- **Risk**: Production costs exceed budget due to over-provisioned infrastructure
  - Mitigation: Start with minimal production sizing. Use ECS auto-scaling to scale up only when needed. Set AWS billing alerts. Review costs weekly for the first month.

## Testing Strategy Summary

| Layer | Tool | Coverage Target | What It Tests |
|-------|------|----------------|---------------|
| Unit tests | Jest | 80%+ per service | Business logic, algorithms, validators, utilities |
| Integration tests | Jest + Supertest | All API endpoints | Request -> Response full path, auth, validation, DB |
| E2E tests (web) | Cypress | 4 user journeys | Full shipper, dispatcher, admin workflows |
| E2E tests (mobile) | Detox | 5 critical flows | Registration, load board, shipment lifecycle, POD, payments |
| Load tests | k6 / Artillery | Performance targets | p95 latency, throughput, resource usage under load |
| Security tests | ESLint security, Snyk, manual | OWASP Top 10 | Injection, auth bypass, XSS, misconfig |
| Accessibility | axe-core | WCAG 2.1 AA | Keyboard nav, screen readers, contrast |

## Success Criteria

- [ ] Complete freight lifecycle works: Post -> Match -> Bid -> Book -> Pickup -> Transit -> Deliver -> Pay -> Rate
- [ ] All 4 user roles can complete their primary workflows
- [ ] Real-time GPS tracking visible to shipper within 2 seconds of driver location change
- [ ] Payment processing works end-to-end (shipper charged, carrier paid out)
- [ ] Push notifications delivered to mobile devices for all key events
- [ ] API p95 response time under 500ms at expected load (500 concurrent users)
- [ ] 80%+ test coverage across all backend services
- [ ] Zero CRITICAL security findings at launch
- [ ] Mobile app approved on both iOS App Store and Google Play Store
- [ ] 10+ successful real shipments completed during beta
- [ ] Beta user NPS score above 30

---

## Key File Paths (Absolute)

The project root for all implementation is:

- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\` -- project root
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\CLAUDE.MD` -- existing spec file
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\packages\database\prisma\schema.prisma` -- database schema (create in step 1.10)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\api-gateway\src\main.ts` -- API gateway entry point (create in step 1.12)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\user-service\src\main.ts` -- auth service entry point (create in step 1.15)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\matching-service\src\main.ts` -- matching service entry point (create in step 2.1)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\dispatch-service\src\main.ts` -- dispatch service entry point (create in step 2.5)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\tracking-service\src\main.ts` -- tracking service entry point (create in step 2.7)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\payment-service\src\main.ts` -- payment service entry point (create in step 2.10)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\services\notification-service\src\main.ts` -- notification service entry point (create in step 2.11)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\apps\web\src\app\layout.tsx` -- web app root (create in step 2.15)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\apps\mobile\src\App.tsx` -- mobile app root (create in step 2.21)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\docker\docker-compose.yml` -- local dev infrastructure (create in step 1.4)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\infrastructure\terraform\main.tf` -- AWS infrastructure (create in step 1.17)
- `C:\Users\Dell\OneDrive\Desktop\truck_platform\truck-shipping\.github\workflows\ci.yml` -- CI pipeline (create in step 1.5)