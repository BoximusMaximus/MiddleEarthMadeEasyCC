# Middle Earth Made Easy

An interactive, full-stack web application built on top of a high-resolution Middle Earth map. Registered users can place personal pins, measure distances between any two points, and save named travel routes. Administrators can add permanent lore locations visible to all users. Below are build instructions for those hoping to recreate this project.

**Live demo:** *(to be implemented)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React (JSX) |
| Routing | React Router DOM |
| Map | Leaflet + React-Leaflet (CRS.Simple) |
| Backend / Auth / DB | Supabase (PostgreSQL + Row Level Security) |
| Deployment | Vercel |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Supabase](https://supabase.com/) account and project

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/BoximusMaximus/MiddleEarthMadeEasyCC.git
cd MiddleEarthMadeEasyCC
```

### 2. Install dependencies

The source code lives in the `Middle Earth Made Easy` subdirectory.

```bash
cd "Middle Earth Made Easy"
npm install
```

### 3. Create the environment file

Create a file named `.env` inside the `Middle Earth Made Easy` folder (next to `package.json`):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

Both values are found in your Supabase project under **Project Settings → API**:
- **Project URL** → `VITE_SUPABASE_URL`
- **Project API keys → anon / public** → `VITE_SUPABASE_PUBLISHABLE_KEY`

> The anon key is safe to expose. Data access is enforced by Row Level Security policies at the database layer, not by hiding this key.

### 4. Set up the Supabase database

Run the following SQL in the Supabase **SQL Editor** to create the required tables and enable Row Level Security:

```sql
-- Pins: user-placed markers
create table pins (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  name text not null,
  note text,
  category text default 'human',
  x numeric not null,
  y numeric not null,
  created_at timestamptz default now()
);
alter table pins enable row level security;
create policy "users manage own pins" on pins for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create index pins_user_id_idx on pins (user_id);

-- Paths: saved measurement routes
create table paths (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  name text not null,
  points jsonb not null,
  total_miles numeric,
  created_at timestamptz default now()
);
alter table paths enable row level security;
create policy "users manage own paths" on paths for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create index paths_user_id_idx on paths (user_id);

-- Locations: admin-placed permanent Middle Earth locations
create table locations (
  id bigint generated always as identity primary key,
  name text not null,
  realm text,
  location_type text,
  inhabitants text[],
  founded_date text,
  description text,
  x numeric not null,
  y numeric not null,
  created_at timestamptz default now()
);
alter table locations enable row level security;
create policy "anyone can read locations" on locations for select to authenticated using (true);
create policy "admins manage locations" on locations for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

### 5. (Optional) Grant admin access to a user

In the Supabase **SQL Editor**, replace the email with the account you want to promote:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'your-admin-email@example.com';
```

### 6. Start the development server

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## Building for Production

```bash
npm run build
```

The compiled output lands in `Middle Earth Made Easy/dist/`. You can preview it locally with:

```bash
npm run preview
```

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/).
3. Set the **Root Directory** to `Middle Earth Made Easy` in the Vercel project settings.
4. Add the two environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`) under **Settings → Environment Variables**.
5. Deploy — Vercel auto-detects Vite and sets the correct build command.

---

## Project Structure

```
Middle Earth Made Easy/
├── src/
│   ├── assets/          # Middle Earth map image
│   ├── components/      # MapView, Sidebar, PinMarker, LocationMarker
│   ├── context/         # AuthContext (Supabase session provider)
│   ├── pages/           # Login, Register, MapPage, AdminPage
│   └── utils/           # supabase.js (single client instance)
├── .env                 # Local only — never commit this file
├── index.html
└── package.json
```

---

## Security Notes

- `.env` is listed in `.gitignore` and is never committed.
- The publishable Supabase key is intentionally bundled into the client — this is by design. All data access is controlled by Row Level Security policies on the server.
- Admin role is stored in `app_metadata` (server-set only) — it cannot be edited by users.
