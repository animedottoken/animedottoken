-- Create marketplace settings table to store platform configuration
CREATE TABLE public.marketplace_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_fee_percentage numeric NOT NULL DEFAULT 2.5,
  platform_wallet_address text NOT NULL DEFAULT '7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Marketplace settings are viewable by everyone" 
ON public.marketplace_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only service role can modify marketplace settings" 
ON public.marketplace_settings 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Insert default settings
INSERT INTO public.marketplace_settings (platform_fee_percentage, platform_wallet_address) 
VALUES (2.5, '7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8');