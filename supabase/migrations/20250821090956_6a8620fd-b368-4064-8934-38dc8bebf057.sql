-- Check for any remaining SECURITY DEFINER views
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%SECURITY DEFINER%';

-- Also check for functions that might be security definer
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE prosecdef = true
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');