-- Limpar triggers existentes e otimizar performance

-- 1. Criar índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id_active ON user_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_plans_last_reset_date ON user_plans(last_reset_date);
CREATE INDEX IF NOT EXISTS idx_signals_user_id_status ON signals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_earnings_user_id_date ON daily_earnings_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id_status ON payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id_status ON withdrawal_requests(user_id, status);

-- 2. Remover TODOS os triggers problemáticos primeiro
DROP TRIGGER IF EXISTS save_daily_history_and_reset_trigger ON public.profiles;
DROP TRIGGER IF EXISTS save_daily_history_and_reset_optimized_trigger ON public.profiles;
DROP TRIGGER IF EXISTS reset_user_plan_daily_stats_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS reset_daily_signals_brazil_trigger ON public.profiles;

-- 3. Manter apenas trigger essencial de comissões
CREATE OR REPLACE TRIGGER process_referral_commissions_once_trigger
  AFTER INSERT ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_commissions_once();

-- 4. Limpar dados antigos para reduzir overhead
DELETE FROM public.daily_earnings_history 
WHERE date < CURRENT_DATE - INTERVAL '90 days';

-- 5. Atualizar estatísticas das tabelas
ANALYZE public.profiles;
ANALYZE public.user_plans;
ANALYZE public.signals;
ANALYZE public.daily_earnings_history;