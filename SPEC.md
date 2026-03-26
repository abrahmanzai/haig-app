# HAIG Web App (Next.js)

This project is the full-stack High Agency Investment Group web application specified in the prompt.

## Quick start

1. cd haig-app
2. npm install
3. cp .env.example .env.local
4. Set Supabase env vars
5. npm run dev

## Routes
- `/` public landing page
- `/login` login UI
- `/signup` register UI
- `/dashboard` member dashboard
- `/calendar` event calendar
- `/pitches` investment pitch list
- `/portfolio` portfolio and holdings
- `/admin` admin panel

## Supabase
- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`

## Voting utility
- `lib/voting.ts`
