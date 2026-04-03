
-- Add is_popular flag for "Most Popular" badge
ALTER TABLE public.subscription_plans ADD COLUMN is_popular boolean NOT NULL DEFAULT false;

-- Add limit_period: 'daily' or 'monthly' to control how limits reset
ALTER TABLE public.subscription_plans ADD COLUMN limit_period text NOT NULL DEFAULT 'monthly';

-- Add duration_months for displaying duration in months (optional, null means use duration_days)
ALTER TABLE public.subscription_plans ADD COLUMN duration_months integer NULL;
