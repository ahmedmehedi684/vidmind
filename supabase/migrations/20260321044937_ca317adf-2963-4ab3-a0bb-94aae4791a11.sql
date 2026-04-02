
-- Allow admins to view all user_settings (to check API key status)
CREATE POLICY "Admins can view all user_settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
