import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function FixCommissions() {
  const handleFix = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-duplicate-commissions');
      if (error) throw error;
      console.log('Commissions fixed:', data);
      window.location.reload();
    } catch (error) {
      console.error('Error fixing commissions:', error);
    }
  };

  return (
    <Button onClick={handleFix} className="bg-red-600 hover:bg-red-700">
      Corrigir Comissões Duplicadas
    </Button>
  );
}