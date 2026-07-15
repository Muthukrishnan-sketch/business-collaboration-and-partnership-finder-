# Threadwork

B2B partnership matchmaking platform — helps small local businesses discover
compatible partners nearby (e.g. a wedding photographer connecting with
decorators, caterers, and makeup artists).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + PostGIS via Supabase |
| Auth | Clerk (swap for Auth.js if preferred) |
| AI | Anthropic Claude (proposal generation), Gemini/OpenAI (optional) |
| Maps | Google Maps / Mapbox |
| Realtime | Supabase Realtime (chat) |
| Storage | Supabase Storage (proposal PDFs) |
| SMS | Twilio |

## Project structure

```
threadwork/
  frontend/          Next.js app
    app/              App Router pages
    components/        UI components (bring over from partner-match-demo.html)
    lib/
      api.ts            Typed client for the FastAPI backend
      supabaseClient.ts  Browser Supabase client (for realtime + RLS-scoped reads)
  backend/            FastAPI app
    app/
      main.py            App entrypoint, router registration
      core/              Settings, Supabase service-role client
      api/v1/            Route handlers (businesses, matches, connections, proposals)
      models/            Pydantic schemas
      services/
        matching.py        Rule-based + geospatial matching engine (v0)
        ai_proposal.py      Claude-powered collaboration proposal generator
  database/
    schema.sql          Full Postgres/PostGIS schema + RLS policies + nearby_businesses() RPC
  docker-compose.yml   Local Postgres+PostGIS for dev (optional — can point straight at Supabase)
```

## Getting started

### 1. Database (Supabase)

1. Create a project at supabase.com.
2. In the SQL editor, run `database/schema.sql`. This enables PostGIS, creates all
   tables, RLS policies, and the `nearby_businesses()` matching RPC.
3. Grab your project URL, anon key, and service role key from Settings → API.

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in Supabase + Anthropic keys
uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase public keys + API base URL
npm run dev
```

App at `http://localhost:3000`.

## Roadmap (where this scaffold leaves off)

- [ ] Port the visual design from `partner-match-demo.html` into real components
      under `frontend/components/` (score ring, compatibility bar chart,
      schematic proximity map, request table) — the mock data maps directly
      to `MatchCandidate` / `Business` / `ConnectionOut` types in `lib/api.ts`.
- [ ] Wire Clerk auth; replace the placeholder `owner_user_id` query param in
      `routes_business.py` with a real auth dependency that reads the verified
      JWT.
- [ ] Replace `_extract_lng_lat()` in `services/matching.py` with a proper
      Postgres view/RPC that returns `lng`/`lat` as plain floats (Supabase's
      PostgREST returns geography columns inconsistently depending on config).
- [ ] Add a `services/ai_matching.py` that uses Claude/Gemini to generate the
      `reasoning_tags` and refine `category_fit_score` from business
      descriptions and review sentiment, instead of the static
      `COMPLEMENTARY_CATEGORIES` map.
- [ ] Build the Google Places ingestion job (business data + reviews →
      `reviews` table, `sentiment_score` via an LLM pass).
- [ ] Build Instagram business data ingestion for `social_engagement_score`.
- [ ] Wire Supabase Realtime to the chat modal (subscribe to `messages` table
      filtered by `conversation_id`).
- [ ] Proposal PDF generation: render `proposals.terms` to PDF, upload to
      Supabase Storage, save the path to `proposals.pdf_url`.
- [ ] Twilio SMS notifications for new connection requests.

## Notes

- `services/matching.py` is intentionally rule-based (v0) so the whole flow
  works end-to-end before layering in AI — swap in AI-generated compatibility
  reasoning once the base pipeline is proven.
- RLS policies in `schema.sql` assume Clerk/Auth.js JWTs are passed through to
  Supabase (`auth.jwt() ->> 'sub'`). Adjust if you use a different auth setup.
