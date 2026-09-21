# Progress Compass 🧭
### Behavioral Progress-Tracking and Adaptive-Planning Companion for School Students
**Pilot Deployment:** Edify School Tirupati (15–30 Students, Pilot Cohort 2026)

---

## 🚫 What This Is NOT (Strict Functional Scope)
**This is NOT a tutor and does NOT teach, explain, or solve academic content.**
- It **never** generates subject-matter answers, explanations, solutions, or practice questions.
- It only tracks what students log about their own homework and exam tasks, and helps them plan around their own behavioral patterns.
- This boundary is enforced everywhere in code, system instructions, and AI extraction prompts.

---

## 💡 Core Idea: The Plan → Do → Reflect Loop
Students log what is assigned (by voice or typing). Progress Compass tracks task completion over time and turns that history into an **adaptive daily plan** — not merely a due-date list:
1. **Plan (Today's Plan):** 3–5 items max, rule-ordered based on behavioral lag patterns, each with a one-line rationale (e.g. *"Science first — this tends to slip for you"*).
2. **Do (Action):** Large touch targets, quick completion checkboxes, and a prominent voice/typed task logger.
3. **Reflect (Weekly Reflection):** A prompt asking *"What worked this week? What will you change?"*, accompanied by factual, neutral trend narration.

---

## 🛠 Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide icons.
- **Backend / Data:** Supabase (PostgreSQL, Row Level Security, dynamic SQL views).
- **AI Integration:** Google Gemini API (`@google/genai`, model `gemini-3.8-flash`) restricted strictly to two narrow jobs (task metadata parsing and factual trend narration).
- **Voice:** Browser-native **Web Speech API** (`SpeechRecognition` for input and `SpeechSynthesis` for audio read-aloud) — zero paid third-party voice services required.
- **Hosting:** Cloudflare Pages (Git integration with auto-deploy on push to `main`).

---

## 📊 Data Model (Supabase Postgres)

The complete SQL migration script is located in [`supabase/schema.sql`](./supabase/schema.sql).

### 1. `students`
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `username` (TEXT, UNIQUE) — School-issued identifier (e.g. `aarav8`)
- `pin_hash` (TEXT) — 4-digit secret PIN (no personal email required for minors)
- `class` (TEXT) — e.g. `Class 8-A`
- `school` (TEXT) — `Edify School Tirupati`
- `pilot_cohort` (TEXT) — `Pilot-2026-Batch1`
- `created_at` (TIMESTAMPTZ)

### 2. `tasks`
- `id` (UUID, Primary Key)
- `student_id` (UUID, References `students.id`)
- `subject` (TEXT) — e.g. `Mathematics`, `Science`, `English`, `Social Science`
- `description` (TEXT)
- `assigned_date` (DATE)
- `due_date` (DATE)
- `status` (TEXT: `'pending' | 'done' | 'late'`)
- `completed_at` (TIMESTAMPTZ, nullable)
- `source` (TEXT: `'typed' | 'voice'`)
- `estimated_minutes` (INTEGER, default 30)

### 3. `behavior_stats` (Dynamic SQL View)
Derived dynamically via SQL rather than redundantly updated by hand:
- `student_id`, `subject`
- `avg_lag_days`: Average days elapsed past due date for overdue or completed items.
- `completion_rate_7d`: Percentage of tasks completed in past 7 days.
- `completion_rate_30d`: Percentage of tasks completed in past 30 days.
- `current_streak`: Consecutive days with at least one verified task completion.
- `last_computed_at`: Computation timestamp.

### 4. `reflections`
- `id` (UUID, Primary Key)
- `student_id` (UUID, References `students.id`)
- `week_start` (DATE)
- `prompt_answered` (TEXT)
- `response_text` (TEXT)
- `source` (TEXT: `'typed' | 'voice'`)
- `created_at` (TIMESTAMPTZ)

### 5. Row Level Security (RLS) & Privacy
- **Students Table:** `USING (auth.uid() = id)`
- **Tasks Table:** `USING (auth.uid() = student_id)`
- **Reflections Table:** `USING (auth.uid() = student_id)`
- **Pilot Admin View:** Accessible through the `get_pilot_cohort_aggregates()` `SECURITY DEFINER` function, which computes cohort totals and averages without ever exposing student identities, raw transcripts, or personal reflections.

---

## 🤖 AI Usage — Explicit Narrow Boundaries
Gemini is called for **strictly two tasks**:
1. **Parsing Spoken/Typed Sentences:** Extracts `{ subject, description, due_date, estimated_minutes }` from natural language (e.g. *"Science homework due Friday exercises 1 to 5"*). Extracted fields are shown to the student to confirm/edit before saving.
2. **Behavioral Trend Narration:** Turns empirical `behavior_stats` into a single, factual trend sentence (e.g. *"You're more consistent in Maths, Science still tends to slip"*).

> **Code Boundary Guarantee:** Every Gemini call site in `server.ts` and `src/lib/gemini.ts` contains a mandatory assertion comment verifying no academic instruction or tutoring occurs.

---

## 🚀 Setup & Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/progress-compass.git
cd progress-compass
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set the required variables:
```ini
# Gemini API Key (from Google AI Studio: https://aistudio.google.com/)
GEMINI_API_KEY="your_gemini_api_key_here"

# (Optional for Production Supabase)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```
*Note: If Supabase credentials are left blank, Progress Compass automatically operates in Pilot Demo Mode, pre-seeded with 5 student accounts and full `localStorage` persistence.*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🗄️ Supabase Production Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** tab.
3. Open the file `supabase/schema.sql` from this repository.
4. Paste the script and click **Run**.
   - This creates the tables, constraints, indexes, RLS policies, views, and seed data for the pilot.
5. In **Authentication > Providers > Email**, enable email or use username auth mapped to `username@pilot.edify.internal`.

---

## ☁️ Cloudflare Pages Deployment (Git Integration)

Progress Compass is configured for seamless deployment to Cloudflare Pages with auto-deploy on push to `main`:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and select **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your repository.
3. Configure the **Build Settings**:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
4. Under **Environment variables**, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Public Key.
5. Click **Save and Deploy**. Any push to `main` will automatically build and deploy the applet.

---

## 🔒 Minor Data Privacy & Consent Policy
- **Pilot Population:** School students (minors) at Edify School Tirupati.
- **Parental / Institutional Consent:** Prior to pilot onboarding, explicit consent must be secured from parents/guardians and school administration.
- **Zero Third-Party Trackers:** No advertising libraries, tracking beacons, or commercial analytics SDKs are permitted or installed.
- **Data Minimization:** Only school subjects, task descriptions, and completion timestamps are stored. Personal emails are omitted in favor of school-issued usernames.
