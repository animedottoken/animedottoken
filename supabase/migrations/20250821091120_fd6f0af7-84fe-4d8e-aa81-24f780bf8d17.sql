-- Check ALL views in the public schema to see if any exist that might be problematic
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public';

-- More specifically check for any remaining security definer patterns
\d+ public.collections_public;