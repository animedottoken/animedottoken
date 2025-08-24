-- Fix search path security warnings for functions
ALTER FUNCTION public.calculate_profile_rank(INTEGER) SET search_path = public;
ALTER FUNCTION public.update_profile_rank() SET search_path = public;
ALTER FUNCTION public.increment_user_trade_count(TEXT) SET search_path = public;