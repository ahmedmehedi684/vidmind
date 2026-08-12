CREATE TABLE public.web_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_links TO authenticated;
GRANT ALL ON public.web_links TO service_role;
ALTER TABLE public.web_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own web links" ON public.web_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_web_links_updated_at BEFORE UPDATE ON public.web_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();