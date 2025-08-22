
-- 1) Allow creator-controlled locks as a list of field names (e.g., ["royalty_percentage","symbol"])
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS locked_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Add supply mode: "fixed" (finite) or "open" (open edition ∞). We’ll enforce values in app/edge logic for BC.
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS supply_mode text NOT NULL DEFAULT 'fixed';

-- 3) Optional end time for Open Edition / timed mints
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS mint_end_at timestamp with time zone NULL;

-- Notes:
-- - We intentionally avoid strict CHECK constraints for compatibility with existing data.
-- - max_supply=0 will represent unlimited for Open Edition; items_available stays 0 and UI shows ∞.
