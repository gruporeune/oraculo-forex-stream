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
    const { payment_id, user_id } = await req.json();

    if (!payment_id || !user_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'payment_id e user_id são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking payment status for:', payment_id);

    // Call Faturefy status check API
    const statusResponse = await fetch(`https://api.faturefy.site/checkout/status_checkout/${payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('FATUREFY_API_TOKEN')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Faturefy status API error:', statusResponse.status, errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao verificar status do pagamento' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const statusData = await statusResponse.json();
    console.log('Faturefy status response:', JSON.stringify(statusData, null, 2));

    // Get the payment transaction from our database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', payment_id)
      .eq('user_id', user_id)
      .single();

    if (transactionError || !transaction) {
      console.error('Error fetching transaction:', transactionError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Transação não encontrada' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if payment is approved (status: "aprovado")
    if (statusData.status === 'aprovado') {
      console.log('Payment approved, activating plan...');

      // Update transaction status
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
      }

      // Check if user already has this plan to avoid duplicates
      const { data: existingPlans } = await supabase
        .from('user_plans')
        .select('id')
        .eq('user_id', user_id)
        .eq('plan_name', transaction.plan_name)
        .eq('is_active', true);

      const planCount = existingPlans?.length || 0;

      // Only create new plan if user doesn't have 5 already
      if (planCount < 5) {
        // Create user plan
        const { error: planError } = await supabase
          .from('user_plans')
          .insert({
            user_id: user_id,
            plan_name: transaction.plan_name,
            is_active: true,
            purchase_date: new Date().toISOString()
          });

        if (planError) {
          console.error('Error creating user plan:', planError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Erro ao ativar plano' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update user profile plan status
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            plan: transaction.plan_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        console.log('Plan activated successfully for user:', user_id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'paid',
        message: 'Pagamento confirmado e plano ativado!' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (statusData.status === 'pendente') {
      return new Response(JSON.stringify({ 
        success: true, 
        status: 'pending',
        message: 'Pagamento ainda pendente' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: true, 
        status: 'failed',
        message: 'Pagamento não foi aprovado' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in check-faturefy-payment:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});