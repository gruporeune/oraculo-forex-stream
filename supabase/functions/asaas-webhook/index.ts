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
    console.log('🔔 Asaas webhook received:', JSON.stringify(payload, null, 2));

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
      console.log('✅ Payment confirmed, activating plan for user:', transaction.user_id);

      // Verificar se já existe um plano ativo para evitar duplicação
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_plans')
        .select('id, is_active')
        .eq('user_id', transaction.user_id)
        .eq('plan_name', transaction.plan_name)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing plan:', checkError);
        throw checkError;
      }

      if (existingPlan?.is_active) {
        console.log('⚠️ Plan already active for user, skipping duplicate activation');
        return new Response(
          JSON.stringify({ success: true, message: 'Plan already active' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

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
        console.error('❌ Error updating transaction:', updateError);
        throw updateError;
      }

      console.log('✅ Transaction updated to paid');

      // Ativar o plano do usuário (ON CONFLICT para prevenir duplicatas)
      const { error: planError } = await supabase
        .from('user_plans')
        .insert({
          user_id: transaction.user_id,
          plan_name: transaction.plan_name,
          is_active: true,
          purchase_date: new Date().toISOString()
        });

      if (planError) {
        console.error('❌ Error creating user plan:', planError);
        throw planError;
      }

      console.log('✅ User plan created successfully');

      // Atualizar plano principal se for o primeiro ou se for melhor que o atual
      const planHierarchy = ['free', 'partner', 'master', 'pro', 'premium', 'platinum'];
      
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', transaction.user_id)
        .single();

      if (profileFetchError) {
        console.error('❌ Error fetching profile:', profileFetchError);
      }

      const currentPlanIndex = planHierarchy.indexOf(profile?.plan || 'free');
      const newPlanIndex = planHierarchy.indexOf(transaction.plan_name);

      console.log(`📊 Plan comparison: current=${profile?.plan} (${currentPlanIndex}), new=${transaction.plan_name} (${newPlanIndex})`);

      if (newPlanIndex > currentPlanIndex) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            plan: transaction.plan_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id);

        if (profileUpdateError) {
          console.error('❌ Error updating profile plan:', profileUpdateError);
        } else {
          console.log('✅ Profile plan updated to:', transaction.plan_name);
        }
      }

      console.log('🎉 Plan activated successfully for user:', transaction.user_id);
    } else {
      console.log('ℹ️ Event not processed (not a payment confirmation):', event);
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
