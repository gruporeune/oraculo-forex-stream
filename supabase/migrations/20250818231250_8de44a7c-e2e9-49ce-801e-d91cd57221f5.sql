-- Criar índices para otimizar consultas frequentes
-- Índice para user_plans.user_id para consultas de planos do usuário
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans (user_id);

-- Índice para user_plans.is_active para filtrar planos ativos
CREATE INDEX IF NOT EXISTS idx_user_plans_is_active ON public.user_plans (is_active);

-- Índice composto para user_plans (user_id, is_active) - consulta mais comum
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id_active ON public.user_plans (user_id, is_active);

-- Índice para signals.user_id para consultas de sinais do usuário
CREATE INDEX IF NOT EXISTS idx_signals_user_id ON public.signals (user_id);

-- Índice para signals.status para filtrar sinais ativos
CREATE INDEX IF NOT EXISTS idx_signals_status ON public.signals (status);

-- Índice para signals.created_at para ordenação temporal
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON public.signals (created_at);

-- Índice composto para signals (user_id, status) - consulta comum
CREATE INDEX IF NOT EXISTS idx_signals_user_id_status ON public.signals (user_id, status);

-- Índice para profiles.referred_by para consultas de referência
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles (referred_by);

-- Índice para profiles.last_reset_date para reset diário
CREATE INDEX IF NOT EXISTS idx_profiles_last_reset_date ON public.profiles (last_reset_date);

-- Índice para daily_earnings_history.user_id
CREATE INDEX IF NOT EXISTS idx_daily_earnings_user_id ON public.daily_earnings_history (user_id);

-- Índice para daily_earnings_history.date para consultas temporais
CREATE INDEX IF NOT EXISTS idx_daily_earnings_date ON public.daily_earnings_history (date);

-- Índice para referral_commissions.referrer_id
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON public.referral_commissions (referrer_id);

-- Índice para referral_commissions.created_at
CREATE INDEX IF NOT EXISTS idx_referral_commissions_created_at ON public.referral_commissions (created_at);

-- Atualizar estatísticas das tabelas para otimizar o planner
ANALYZE public.profiles;
ANALYZE public.user_plans;  
ANALYZE public.signals;
ANALYZE public.daily_earnings_history;
ANALYZE public.referral_commissions;
ANALYZE public.payment_transactions;
ANALYZE public.withdrawal_requests;