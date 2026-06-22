# Middle Earth Made Easy — Claude Guidelines

## Project Context

Interactive Middle Earth map app. Stack: Vite + React (JSX), React Router DOM, Axios, Supabase (auth + DB), deployed on Vercel.

Full requirements: see `../prompt.md`
Supabase skills: `.agents/skills/supabase/SKILL.md` and `.agents/skills/supabase-postgres-best-practices/SKILL.md`

---

## Supabase Rules (MUST follow — from installed agent skills)

### General
- Supabase changes frequently. **Do not rely on training data** for API signatures or config. Fetch `https://supabase.com/changelog.md` and relevant docs before implementing new Supabase features.
- After any schema or auth change, run a test query to verify it works. A fix without verification is incomplete.
- The Supabase client lives at `src/utils/supabase.js` — import from there, never re-initialize.

### Auth & JWT Security
- **Never use `user_metadata` / `raw_user_meta_data` in RLS or authorization logic** — it is user-editable and unsafe. Use `app_metadata` / `raw_app_meta_data` instead.
- Deleting a user does not invalidate their existing JWT. Sign out or revoke sessions first.
- **Never expose the `service_role` key in frontend code.** The `.env` uses only the publishable key.

### RLS — Required on Every Table
Enable RLS on every table in the `public` schema before exposing it.

```sql
alter table my_table enable row level security;
```

**Correct policy pattern** (ownership check):
```sql
create policy "users see own rows" on my_table
  for select
  to authenticated
  using ( (select auth.uid()) = user_id );
```

**UPDATE must have both USING and WITH CHECK** (or users can reassign rows to others):
```sql
create policy "users update own rows" on my_table
  for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
```

- **`(select auth.uid())`** — always wrap in a subquery. Calling `auth.uid()` bare is evaluated per-row; the subquery form is cached once per query (100x+ faster on large tables).
- **`auth.role()` is deprecated** — use the `TO authenticated` / `TO anon` clause instead.
- **`TO authenticated` alone is NOT sufficient** — it only checks the role, not which user. Always add a `USING` predicate.
- **Views bypass RLS by default.** Use `WITH (security_invoker = true)` on Postgres 15+.
- **`SECURITY DEFINER` bypasses RLS.** Never add it to resolve a permission error. If genuinely needed, keep the function in a non-exposed schema and always include an `auth.uid()` check inside.
- Always add an index on any column used in a policy:
  ```sql
  create index my_table_user_id_idx on my_table (user_id);
  ```

### Schema Design Defaults
```sql
-- Primary keys: bigint identity (not serial, not uuid v4)
id bigint generated always as identity primary key

-- Strings: text (not varchar(n) — no benefit, adds artificial limits)
name text

-- Timestamps: always timezone-aware
created_at timestamptz default now()

-- Booleans: boolean (not varchar)
is_active boolean default true

-- Money/decimals: numeric (not float)
price numeric(10,2)
```

### Schema Change Workflow
1. **Iterate using** `execute_sql` (MCP) or `supabase db query` (CLI ≥ v2.79.0). Do NOT use `apply_migration` to iterate — it writes a history entry on every call.
2. **Before committing:** run `supabase db advisors` (CLI ≥ v2.81.3) — fix any issues.
3. **Generate migration:** `supabase db pull <descriptive-name> --local --yes`
4. **Verify:** `supabase migration list --local`

### CLI Discovery
Always use `--help` — never guess CLI flags. The CLI structure changes between versions.

---

## Project Coding Conventions

- Functional React components only, plain JSX (no TypeScript)
- One component per file, co-locate its CSS file
- Routes handled by React Router DOM — keep `App.jsx` as a thin router shell
- All Supabase calls go through `src/utils/supabase.js`
- All HTTP calls to external APIs go through Axios
- Surface errors to the user via UI — never swallow silently
- No comments unless the WHY is non-obvious
