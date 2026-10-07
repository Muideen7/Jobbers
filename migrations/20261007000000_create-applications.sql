-- Prompt 2 — Applications data layer (InsForge)
--
-- ADDITIVE ONLY. Nothing existing is renamed, dropped or retyped:
--   * two new tables (applications, application_events)
--   * one new nullable column on profiles (last_jobs_visit_at)
--
-- Run with the linked CLI (NOT the MCP run-raw-sql tool, which points at a
-- different project):
--   npx -y @insforge/cli db query "$(cat migrations/20261007000000_create-applications.sql)"

CREATE TABLE public.applications (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id            uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status            text        NOT NULL DEFAULT 'saved'
                                CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'closed')),
  closed_reason     text        CHECK (closed_reason IN ('rejected', 'withdrawn', 'no_response')),
  applied_at        timestamptz,
  interview_at      timestamptz,
  next_follow_up_at timestamptz,
  notes             text,
  position          integer     NOT NULL DEFAULT 0,
  prep              jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_user_job_key UNIQUE (user_id, job_id)
);

CREATE INDEX applications_user_id_idx     ON public.applications (user_id);
CREATE INDEX applications_user_status_idx ON public.applications (user_id, status);
CREATE INDEX applications_job_id_idx      ON public.applications (job_id);
CREATE INDEX applications_follow_up_idx   ON public.applications (user_id, next_follow_up_at);

-- Reuse the trigger function already backing profiles.updated_at.
CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.application_events (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text        NOT NULL
                             CHECK (type IN ('created', 'status_changed', 'follow_up_set', 'follow_up_sent', 'note')),
  from_status    text,
  to_status      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX application_events_application_idx  ON public.application_events (application_id);
CREATE INDEX application_events_user_created_idx ON public.application_events (user_id, created_at DESC);

-- Existing user profile table: a new nullable column only.
ALTER TABLE public.profiles
  ADD COLUMN last_jobs_visit_at timestamptz;

-- Security: users can only touch their own rows, mirroring the existing
-- *_own policy pattern on jobs / profiles / agent_logs.
ALTER TABLE public.applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete_own"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "application_events_select_own"
  ON public.application_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "application_events_insert_own"
  ON public.application_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Events are immutable (no UPDATE policy); only the owner can remove their own.
CREATE POLICY "application_events_delete_own"
  ON public.application_events FOR DELETE
  USING (auth.uid() = user_id);