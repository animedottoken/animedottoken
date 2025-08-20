-- Make symbol optional to allow simple folder creation without a symbol
ALTER TABLE public.collections
  ALTER COLUMN symbol DROP NOT NULL;