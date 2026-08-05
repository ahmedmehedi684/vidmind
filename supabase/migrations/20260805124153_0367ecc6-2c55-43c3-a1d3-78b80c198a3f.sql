ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'youtube';

CREATE TABLE IF NOT EXISTS public.important_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  url text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.important_links TO authenticated;
GRANT ALL ON public.important_links TO service_role;
ALTER TABLE public.important_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own important links" ON public.important_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.study_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  remind_at time NOT NULL DEFAULT '20:00',
  is_enabled boolean NOT NULL DEFAULT true,
  last_notified_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_reminders TO authenticated;
GRANT ALL ON public.study_reminders TO service_role;
ALTER TABLE public.study_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study reminders" ON public.study_reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);