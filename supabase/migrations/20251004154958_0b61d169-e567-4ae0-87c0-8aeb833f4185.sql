-- Phase 2A: Payment Verification Security Enhancements
-- Ensures collection_id exists and adds performance indexes

-- Ensure collection_id exists in payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add performance index on wallet_address for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_wallet_address 
ON public.payments(wallet_address);

-- Add security documentation to critical columns
COMMENT ON COLUMN public.payments.tx_signature 
IS 'Solana transaction signature - MUST be verified on blockchain before accepting payment';

COMMENT ON CONSTRAINT payments_tx_signature_key ON public.payments 
IS 'Prevents replay attacks - each blockchain signature can only be used once';