# Side Quest 🕹️

Find your crew for whatever you're doing next. SRM students post a bio, create
or join "quests" (groups planning an activity — movies, sports, study
sessions, whatever), filter by who they'd like to join, and chat with their
group in a 2000s AOL-Messenger-styled UI.

## Stack

- **Next.js 14** (App Router) — frontend + serverless routes, no separate
  Express server needed
- **Supabase** — Postgres database, Auth, Storage (profile photos), and
  Realtime (chat)

The original brief mentioned Express and MongoDB; this project consolidates
onto Next.js + Supabase because it covers the same needs (auth, database,
file storage, realtime) with one service and one API key, which mattered a
lot given the time budget.

## Features

- Email/password auth (Supabase Auth), protected routes via middleware
- Profile creation with photo upload, bio, contact info, interests, gender
- Create a "quest" (group) specifying activity type, spots needed, and a
  gender preference for who you'd like to join
- Browse/search/filter open quests, join with one click
- Per-group realtime chat (Supabase Realtime — no page refresh needed)
- Block and report users from within a shared group
- Loading states, empty states, inline form validation, and error messages
  throughout
- Fully responsive, retro AOL Messenger–styled UI (grey/blue palette,
  pixel font for headers, beveled window chrome)

## Local setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run the entire contents of
   `supabase/schema.sql`. This creates all tables, Row Level Security
   policies, the realtime publication, and the `avatars` storage bucket.
3. In **Project Settings → API**, copy your Project URL and anon public key.
4. In **Authentication → Providers**, email/password is enabled by default.
   For fastest local testing, you can turn off "Confirm email" under
   **Authentication → Settings** so sign-up logs you in immediately.
5. Copy the env template and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
6. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
7. Visit `http://localhost:3000` — you'll be redirected to `/signup`.

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   environment variables in the Vercel project settings.
4. Deploy. No other configuration needed.

## Database schema

| Table            | Purpose                                             |
|-------------------|------------------------------------------------------|
| `profiles`         | User bio, photo, contact, gender, interests           |
| `groups`           | A quest — title, activity type, spots, gender preference |
| `group_members`    | Who has joined which group                            |
| `messages`         | Group chat messages (realtime-enabled)                |
| `blocked_users`    | User-to-user blocks                                   |
| `reports`          | User-filed reports on other users                      |

All tables have Row Level Security enabled — see `supabase/schema.sql` for
the exact policies (e.g. chat messages are only readable/writable by members
of that specific group).

## Known limitations / next steps

- No password-reset flow (out of scope for the time budget)
- Gender-preference matching is a simple filter, not a recommendation engine
- No admin dashboard for reviewing reports (they're stored, not surfaced)
- No pagination on the quest list — fine at small scale, would need it at
  larger scale

## Demo

- Live demo: _add your Vercel URL here_
- Video walkthrough: _add your video link here_
