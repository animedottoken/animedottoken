
-- Ensure the REST clients can SELECT from collections
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.collections TO anon, authenticated;
