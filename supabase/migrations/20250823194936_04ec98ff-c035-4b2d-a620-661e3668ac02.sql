-- Add enable_primary_sales column to collections
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS enable_primary_sales boolean NOT NULL DEFAULT false;