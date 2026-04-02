
-- Channels table for storing favorite YouTube channels
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Each user can see their own channels
CREATE POLICY "Users can manage own channels"
  ON public.channels FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can see all channels
CREATE POLICY "Admins can manage all channels"
  ON public.channels FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add channel_id to admin_notes
ALTER TABLE public.admin_notes ADD COLUMN channel_id uuid REFERENCES public.channels(id) ON DELETE SET NULL;
ALTER TABLE public.admin_notes ADD COLUMN title text NOT NULL DEFAULT '';
