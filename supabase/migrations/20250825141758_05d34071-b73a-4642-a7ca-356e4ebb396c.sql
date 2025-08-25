-- Garantir que o trigger está funcionando corretamente
-- Primeiro vamos verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'process_referral_commissions_fixed';

-- Recriar o trigger se necessário
DROP TRIGGER IF EXISTS process_referral_commissions_trigger ON public.user_plans;

CREATE TRIGGER process_referral_commissions_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_commissions_fixed();