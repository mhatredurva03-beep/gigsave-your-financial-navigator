ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_budget_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_jar_alerts boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  subject_id text NOT NULL DEFAULT '',
  period text NOT NULL DEFAULT '',
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_events_unique_event
  ON public.notification_events (user_id, event_type, subject_id, period);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_events_own" ON public.notification_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);