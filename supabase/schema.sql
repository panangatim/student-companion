-- ==============================================================================
-- STUDY BUDDY — SUPABASE POSTGRES SCHEMA
-- Clean Real Student Companion Database (Zero Mock Seeds)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT ('student_' || substr(md5(random()::text), 1, 9)),
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    pin TEXT DEFAULT '',
    class TEXT NOT NULL DEFAULT 'Grade 6',
    school TEXT DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '🚀',
    favorite_subject TEXT DEFAULT 'General',
    stars INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT ('task_' || substr(md5(random()::text), 1, 9)),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'done', 'late')),
    completed_at TIMESTAMPTZ,
    source TEXT NOT NULL CHECK (source IN ('typed', 'voice')),
    estimated_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_student_status ON public.tasks(student_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_student_due ON public.tasks(student_id, due_date);

-- 4. REFLECTIONS TABLE (Weekly Star Journal)
CREATE TABLE IF NOT EXISTS public.reflections (
    id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text), 1, 9)),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    prompt_answered TEXT NOT NULL,
    response_text TEXT NOT NULL,
    mood TEXT DEFAULT '🌟',
    source TEXT NOT NULL CHECK (source IN ('typed', 'voice')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflections_student ON public.reflections(student_id, week_start);

-- 5. ENABLE ROW LEVEL SECURITY (RLS) & ALLOW ACCESS WITH ANON KEY
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Allow anon public access for student companion app
DROP POLICY IF EXISTS "allow_all_students" ON public.students;
CREATE POLICY "allow_all_students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_tasks" ON public.tasks;
CREATE POLICY "allow_all_tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_reflections" ON public.reflections;
CREATE POLICY "allow_all_reflections" ON public.reflections FOR ALL USING (true) WITH CHECK (true);
