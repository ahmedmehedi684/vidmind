
-- Add currency and feature limits to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT',
ADD COLUMN IF NOT EXISTS limits jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Update existing Free plan with limits
UPDATE public.subscription_plans SET 
  currency = 'BDT',
  limits = '{"tasks": 5, "transactions": 10, "summaries": 5, "channels": 1, "goals": 2, "notes": 5}'::jsonb
WHERE name = 'Free' AND price = 0;

-- Update existing Pro plan with limits  
UPDATE public.subscription_plans SET
  currency = 'BDT', 
  limits = '{"tasks": 20, "transactions": 30, "summaries": 20, "channels": 5, "goals": 10, "notes": 50}'::jsonb
WHERE name = 'Pro' AND price = 9;

-- Insert USD variants
INSERT INTO public.subscription_plans (name, description, price, duration_days, features, is_active, sort_order, currency, limits) VALUES
('Free', 'For getting started', 0, 30, '["10 summaries per month", "Basic notes editor", "3 channels", "30-day history"]'::jsonb, true, 0, 'USD', '{"tasks": 5, "transactions": 10, "summaries": 5, "channels": 1, "goals": 2, "notes": 5}'::jsonb),
('Pro', 'For serious learners and entrepreneurs', 9, 30, '["Unlimited summaries", "Full rich text notes editor", "Unlimited channels", "Full history forever", "Priority AI processing"]'::jsonb, true, 1, 'USD', '{"tasks": 20, "transactions": 30, "summaries": 20, "channels": 5, "goals": 10, "notes": 50}'::jsonb);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
