
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own notifications or global ones
CREATE POLICY "Users can view own or global notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_global = true);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can mark own notifications as read"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_global = true)
WITH CHECK (user_id = auth.uid() OR is_global = true);
