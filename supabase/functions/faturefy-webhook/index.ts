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
    const webhookData = await req.json();
    console.log('Faturefy webhook received:', JSON.stringify(webhookData, null, 2));

    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract payment information from webhook
    const { idSolicitacao, status, transactionId } = webhookData;

    if (!idSolicitacao) {
      console.error('Missing idSolicitacao in webhook data');
      return new Response(JSON.stringify({ error: 'Missing idSolicitacao' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', idSolicitacao)
      .eq('payment_provider', 'faturefy')
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', idSolicitacao, fetchError);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if payment was approved
    if (status === 'aprovado' || status === 'paid' || status === 'completed') {
      console.log('Payment approved for transaction:', idSolicitacao);

      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_data: {
            ...transaction.transaction_data,
            webhookStatus: status,
            webhookReceivedAt: new Date().toISOString()
          }
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update transaction' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user already has this plan active
      const { data: existingPlans } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('is_active', true);

      const planCount = existingPlans?.length || 0;

      if (planCount < 5) {
        // Add new plan to user_plans (allows multiple plans of same type)
        const { error: planError } = await supabase
          .from('user_plans')
          .insert({
            user_id: transaction.user_id,
            plan_name: transaction.plan_name,
            is_active: true,
            purchase_date: new Date().toISOString(),
            daily_earnings: 0,
            daily_signals_used: 0,
            auto_operations_completed_today: 0
          });

        if (planError) {
          console.error('Error creating user plan:', planError);
        } else {
          console.log('User plan created successfully for user:', transaction.user_id);
        }

        // Update user's profile plan
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            plan: transaction.plan_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id);

        if (profileError) {
          console.error('Error updating user profile:', profileError);
        }
      } else {
        console.log('User already has maximum number of plans (5)');
      }

      console.log('Payment processing completed successfully');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment processed successfully' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('Payment status not approved:', status);
      
      // Update transaction with current status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          transaction_data: {
            ...transaction.transaction_data,
            webhookStatus: status,
            webhookReceivedAt: new Date().toISOString()
          }
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction status:', updateError);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Status updated' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in faturefy-webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});