# Agency CRM

A modern sales CRM built for design agencies. Track companies, contacts, deals, and activities through a clean pipeline-driven interface.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM 6
- **Auth:** JWT (jose) with HTTP-only cookies
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod 4 validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and update with your database credentials
cp .env.example .env

# Push schema to database
npx prisma db push

# Seed the database with sample data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

| Email | Password | Role |
|---|---|---|
| jordan@agency.com | password123 | Admin |
| alex@agency.com | password123 | Sales |
| sam@agency.com | password123 | Sales |

## Environment Variables

```
DATABASE_URL="postgresql://postgres:crm_dev_password@localhost:5432/agency_crm"
JWT_SECRET="your-secret-key-change-in-production"
NEXT_PUBLIC_APP_NAME="Agency CRM"
```

## Features

### Dashboard
- Open pipeline value, deals closing this month, won this month, activities due today
- Pipeline breakdown by stage with visual bar chart
- Upcoming activities and recent deals tables

### Deals
- **Pipeline view:** Kanban columns grouped by deal stage (LEAD → QUALIFIED → PROPOSAL → NEGOTIATION)
- **List view:** Sortable table with search and stage filtering
- **Detail page:** Inline editing, stage progression, contacts, notes, activities, history timeline
- Weighted value calculation (value × probability)
- Close deal with WON/LOST status and optional loss reason

### Companies
- List with search, type filtering (CLIENT, PROSPECT, PARTNER, VENDOR)
- Detail page with tabs: Details, Contacts, Deals, Notes, Activities

### Contacts
- List with search, status filtering (ACTIVE, INACTIVE, LEAD)
- Detail page with tabs: Details, Deals, Notes, Activities

### Activities
- Filtered views: Upcoming, All, Overdue, Today, This Week, Completed
- Quick-complete from list
- Types: CALL, EMAIL, MEETING, TASK, FOLLOW_UP, PRESENTATION, OTHER

### Global Search
- `Cmd+K` / `Ctrl+K` to search across companies, contacts, and deals
- Debounced search with instant navigation

### Quick Add
- Header dropdown to quickly create companies, contacts, deals, and activities from anywhere

## Project Structure

```
app/
  (auth)/login/           # Login page
  (dashboard)/            # Protected dashboard layout
    page.tsx              # Dashboard
    companies/            # Companies list + [id] detail
    contacts/             # Contacts list + [id] detail
    deals/                # Deals pipeline/list + [id] detail
    activities/           # Activities list
  api/                    # 23 API routes
    auth/                 # login, logout, me
    companies/            # CRUD + nested contacts, deals, notes
    contacts/             # CRUD + nested notes
    deals/                # CRUD + stage, contacts, notes, history
    activities/           # CRUD
    notes/                # CRUD
    search/               # Global search
    dashboard/            # Dashboard metrics

components/
  forms/                  # Quick-add modals
  layout/                 # Sidebar, Header
  shared/                 # Global search
  ui/                     # shadcn/ui components

lib/
  auth.ts                 # JWT helpers
  prisma.ts               # Prisma client singleton
  format.ts               # Currency, date, badge formatters
  validations.ts          # Zod schemas
  query-client.tsx        # React Query provider
  utils.ts                # cn() utility

prisma/
  schema.prisma           # Database schema
  seed.ts                 # Seed data
```

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
