
-- Payment methods table for admin to configure BDT/USD payment options
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  account_number TEXT NOT NULL DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '📱',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active payment methods
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (is_active = true);

-- Insert default payment methods
INSERT INTO public.payment_methods (name, currency, account_number, account_name, instructions, icon, sort_order) VALUES
('bKash', 'BDT', '01XXXXXXXXX', 'Your Name', 'Send Money করুন এই নম্বরে', '📱', 1),
('Nagad', 'BDT', '01XXXXXXXXX', 'Your Name', 'Send Money করুন এই নম্বরে', '💳', 2),
('Rocket', 'BDT', '01XXXXXXXXX', 'Your Name', 'Send Money করুন এই নম্বরে', '🚀', 3),
('Upay', 'BDT', '01XXXXXXXXX', 'Your Name', 'Send Money করুন এই নম্বরে', '💸', 4),
('Payoneer', 'USD', 'payoneer@email.com', 'Your Name', 'Send payment to this Payoneer email', '💰', 5);
