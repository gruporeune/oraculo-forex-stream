-- Add password field and additional columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'partner', 'master', 'premium', 'platinum')),
ADD COLUMN daily_signals_used integer DEFAULT 0,
ADD COLUMN daily_earnings decimal(10,2) DEFAULT 0,
ADD COLUMN daily_commissions decimal(10,2) DEFAULT 0,
ADD COLUMN available_balance decimal(10,2) DEFAULT 0,
ADD COLUMN last_reset_date date DEFAULT CURRENT_DATE,
ADD COLUMN referral_code text UNIQUE DEFAULT (substring(md5(random()::text || clock_timestamp()::text) for 8)),
ADD COLUMN referred_by uuid REFERENCES public.profiles(id);

-- Create user_referrals table
CREATE TABLE public.user_referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_earned decimal(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(referrer_id, referred_id)
);

-- Create signals table
CREATE TABLE public.signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_pair text NOT NULL,
    signal_type text NOT NULL CHECK (signal_type IN ('CALL', 'PUT')),
    expiration_time integer NOT NULL, -- in minutes
    confidence_percentage integer NOT NULL CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    entry_time timestamp with time zone NOT NULL,
    analysis text,
    is_automatic boolean DEFAULT false,
    profit decimal(10,2) DEFAULT 0,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'won', 'lost')),
    created_at timestamp with time zone DEFAULT now()
);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Create policies for user_referrals
CREATE POLICY "Users can view their own referrals" 
ON public.user_referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert their own referrals" 
ON public.user_referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

-- Create policies for signals
CREATE POLICY "Users can view their own signals" 
ON public.signals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signals" 
ON public.signals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signals" 
ON public.signals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to reset daily stats
CREATE OR REPLACE FUNCTION public.reset_daily_stats()
RETURNS trigger AS $$
BEGIN
  -- Reset daily stats if it's a new day
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.daily_commissions = 0;
    NEW.last_reset_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for daily reset
DROP TRIGGER IF EXISTS reset_daily_stats_trigger ON public.profiles;
CREATE TRIGGER reset_daily_stats_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_daily_stats();