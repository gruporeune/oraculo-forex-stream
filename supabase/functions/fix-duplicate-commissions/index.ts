import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fix vitincastro123 - should have only 60 (level 1 commission for master plan)
    await supabase
      .from('profiles')
      .update({
        total_referral_commissions: 60.0,
        daily_referral_commissions: 60.0,
        available_balance: 60.0
      })
      .eq('username', 'vitincastro123');

    // Fix sofiaelise123 - should have only 18 (level 2 commission for master plan)  
    await supabase
      .from('profiles')
      .update({
        total_referral_commissions: 18.0,
        daily_referral_commissions: 18.0,
        available_balance: 18.0
      })
      .eq('username', 'sofiaelise123');

    console.log('Duplicate commissions fixed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Commissions fixed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fixing commissions:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});