-- Remove triggers duplicados para evitar processamento duplo de comissões
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_v2_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_trigger ON public.user_plans;

-- Manter apenas um trigger para processar comissões
CREATE TRIGGER process_multi_level_referral_commission_trigger 
  AFTER INSERT ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION process_multi_level_referral_commission_v2();