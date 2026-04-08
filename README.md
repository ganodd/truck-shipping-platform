# TruckShip — Digital Freight Marketplace

> Connecting shippers with carriers via an Uber Freight–style platform.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL, Redis, Keycloak)
pnpm dev:infra

# 3. Copy env file and fill in values
cp .env.example .env

# 4. Run database migrations and seed
pnpm db:migrate
pnpm db:seed

# 5. Start all services
pnpm dev:services

# 6. Start web app (in a new terminal)
pnpm dev:web
```

## Monorepo Structure

```
truck-shipping/
├── packages/
│   ├── shared-types/       # TypeScript interfaces & enums
│   ├── shared-validators/  # Zod validation schemas
│   ├── shared-utils/       # Date, currency, geo utilities + config loader
│   └── database/           # Prisma schema, migrations, seed
├── services/
│   ├── api-gateway/        # NestJS gateway, auth, routing (port 3000)
│   ├── user-service/       # Auth, user profiles, KYC (port 3001)
│   ├── matching-service/   # Load CRUD, bidding, matching (port 3002)
│   ├── dispatch-service/   # Shipment lifecycle, state machine (port 3003)
│   ├── tracking-service/   # Real-time GPS, WebSockets (port 3004)
│   ├── payment-service/    # Stripe, invoicing (port 3005)
│   └── notification-service/ # FCM, email, SMS (port 3006)
├── apps/
│   ├── web/                # Next.js (shipper/dispatcher/admin portal, port 3100)
│   └── mobile/             # Expo React Native (driver app)
└── docker/                 # Docker Compose, Dockerfiles
```

## Test Accounts (after seeding)

| Role       | Email                       | Password       |
|------------|-----------------------------|----------------|
| Shipper    | alice@acme-logistics.com    | Password123!   |
| Shipper    | bob@sunrise-supply.com      | Password123!   |
| Carrier    | carlos@truckpro.com         | Password123!   |
| Carrier    | diana@fastfreight.com       | Password123!   |
| Dispatcher | dispatch@truckship.com      | Password123!   |
| Admin      | admin@truckship.com         | Password123!   |

## Key Commands

```bash
pnpm build              # Build all packages and services
pnpm lint               # Lint all packages
pnpm typecheck          # Type check all packages
pnpm test               # Run all tests
pnpm db:studio          # Open Prisma Studio
pnpm db:seed            # Re-seed development data
```

## Tech Stack

- **Backend**: NestJS (TypeScript), 7 microservices
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache/Pub-Sub**: Redis 7
- **Auth**: JWT (HS256) + Keycloak (production)
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Push**: Firebase Cloud Messaging
- **Email**: SendGrid
- **SMS**: Twilio
- **Web**: Next.js 14 + Tailwind CSS + Shadcn/UI
- **Mobile**: Expo (React Native) with background GPS
- **Infra**: AWS (ECS Fargate, RDS, ElastiCache, S3) via Terraform
- **CI/CD**: GitHub Actions + Turborepo
