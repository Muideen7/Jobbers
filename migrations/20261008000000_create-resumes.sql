-- Resume Library — data layer (InsForge)
--
-- ADDITIVE ONLY. One new table (`resumes`); nothing existing is renamed,
-- dropped or retyped:
--   * new table `resumes` (+ indexes, RLS, updated_at trigger)
--   * `profiles.resume_pdf_url` stays exactly as-is and remains the
--     "current/primary" pointer for the sidebar/profile/dashboard.
--   * one-time backfill of existing pointers into `resumes` (idempotent;
--     only inserts for users who have no `resumes` row yet).
--
-- Apply with the linked CLI (NOT the MCP run-raw-sql tool, which points at a
-- different project):
--   npx -y @insforge/cli db migrations up

CREATE TABLE public.resumes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text        NOT NULL DEFAULT 'Untitled resume',
  kind           text        NOT NULL DEFAULT 'uploaded'
                             CHECK (kind IN ('uploaded', 'generated')),
  target_role    text,
  target_company text,
  template       text        CHECK (template IN ('classic', 'modern', 'minimal')),
  storage_path   text,
  file_size      bigint,
  content        jsonb,
  is_primary     boolean     NOT NULL DEFAULT false,
  source_job_id  uuid        REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX resumes_user_created_idx ON public.resumes (user_id, created_at DESC);
CREATE INDEX resumes_source_job_idx   ON public.resumes (source_job_id);

-- At most one primary/current resume per user.
CREATE UNIQUE INDEX resumes_primary_per_user_idx
  ON public.resumes (user_id)
  WHERE is_primary;

-- Reuse the trigger function already backing profiles.updated_at.
CREATE TRIGGER resumes_set_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Security: owner-only, mirroring the *_own policy pattern on
-- profiles / jobs / applications.
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resumes_select_own"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "resumes_insert_own"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_own"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_delete_own"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Backfill: every existing `profiles.resume_pdf_url` becomes that user's
-- primary *uploaded* resume. Idempotent — skipped for users who already have
-- a `resumes` row, so it is safe to re-run.
INSERT INTO public.resumes
  (user_id, name, kind, storage_path, is_primary, created_at, updated_at)
SELECT p.id, 'Uploaded resume', 'uploaded', p.resume_pdf_url, true, now(), now()
FROM public.profiles p
WHERE p.resume_pdf_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.resumes r WHERE r.user_id = p.id
  );