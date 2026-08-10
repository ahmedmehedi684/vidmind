ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS reading_status text NOT NULL DEFAULT 'not_started';

UPDATE public.books SET reading_status = 'reading' WHERE status = 'reading';
UPDATE public.books SET reading_status = 'finished' WHERE status = 'done';

UPDATE public.books SET status = 'bought' WHERE status IN ('done','reading');
UPDATE public.books SET status = 'not_bought' WHERE status = 'not_started';

ALTER TABLE public.books ALTER COLUMN status SET DEFAULT 'not_bought';