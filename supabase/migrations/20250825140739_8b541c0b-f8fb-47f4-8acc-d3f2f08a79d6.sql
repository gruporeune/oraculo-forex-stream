-- Verificar e garantir que o trigger correto esteja ativo
-- Primeiro, vamos verificar se existe algum trigger na tabela user_plans
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_plans'
AND event_object_schema = 'public';

-- Se não houver trigger, vamos criar o trigger correto
-- Primeiro removemos qualquer trigger existente para evitar conflitos
DROP TRIGGER IF EXISTS process_referral_commissions ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_v2_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_once_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_fixed_trigger ON public.user_plans;

-- Agora criamos o trigger correto que funciona
CREATE TRIGGER process_referral_commissions_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_commissions_fixed();