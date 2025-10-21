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
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { payment_id, user_id } = await req.json();

    console.log('Checking Asaas payment status:', payment_id);

    // Buscar status do pagamento na Asaas
    const asaasResponse = await fetch(`https://api.asaas.com/v3/payments/${payment_id}`, {
      headers: {
        'access_token': asaasApiKey
      }
    });

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text();
      console.error('Asaas API error:', errorText);
      throw new Error(`Asaas API error: ${errorText}`);
    }

    const asaasData = await asaasResponse.json();
    console.log('Asaas payment status:', asaasData);

    // Status possíveis: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, RECEIVED_IN_CASH, REFUND_REQUESTED
    let status = 'pending';
    if (asaasData.status === 'RECEIVED' || asaasData.status === 'CONFIRMED') {
      status = 'paid';
    } else if (asaasData.status === 'PENDING' || asaasData.status === 'AWAITING_RISK_ANALYSIS') {
      status = 'pendente';
    } else if (asaasData.status === 'OVERDUE' || asaasData.status === 'REFUNDED') {
      status = 'failed';
    }

    // Se pagamento foi confirmado, ativar o plano
    if (status === 'paid') {
      // Buscar transação no banco
      const { data: transaction, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('external_id', payment_id)
        .single();

      if (!fetchError && transaction && transaction.status !== 'paid') {
        // Atualizar status da transação
        await supabase
          .from('payment_transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        // Ativar o plano do usuário
        await supabase
          .from('user_plans')
          .insert({
            user_id: transaction.user_id,
            plan_name: transaction.plan_name,
            is_active: true,
            purchase_date: new Date().toISOString()
          });

        // Atualizar plano principal se necessário
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: status,
        payment_data: asaasData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in check-asaas-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
})
