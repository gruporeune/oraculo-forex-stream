import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Asaas webhook received:', payload);

    const { event, payment } = payload;

    if (!payment || !payment.id) {
      console.error('Invalid webhook payload');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Buscar transação no banco
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', payment.id)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', payment.id);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    console.log('Transaction found:', transaction);

    // Processar apenas pagamentos confirmados
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      console.log('Payment confirmed, activating plan...');

      // Atualizar status da transação
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }

      // Ativar o plano do usuário
      const { error: planError } = await supabase
        .from('user_plans')
        .insert({
          user_id: transaction.user_id,
          plan_name: transaction.plan_name,
          is_active: true,
          purchase_date: new Date().toISOString()
        });

      if (planError) {
        console.error('Error creating user plan:', planError);
        throw planError;
      }

      // Atualizar plano principal se for o primeiro ou se for melhor que o atual
      const planHierarchy = ['free', 'partner', 'master', 'pro', 'premium', 'platinum'];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', transaction.user_id)
        .single();

      const currentPlanIndex = planHierarchy.indexOf(profile?.plan || 'free');
      const newPlanIndex = planHierarchy.indexOf(transaction.plan_name);

      if (newPlanIndex > currentPlanIndex) {
        await supabase
          .from('profiles')
          .update({ 
            plan: transaction.plan_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id);
      }

      console.log('Plan activated successfully for user:', transaction.user_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in asaas-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})
