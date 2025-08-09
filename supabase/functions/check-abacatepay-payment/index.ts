import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckPaymentRequest {
  paymentId: string;
}

interface AbacatePayCheckResponse {
  data: {
    status: string;
    expiresAt: string;
  };
  error: null | any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Environment check:', {
      hasApiKey: !!Deno.env.get('ABACATEPAY_API_KEY'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    });

    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      throw new Error('ABACATEPAY_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paymentId }: CheckPaymentRequest = await req.json();
    console.log('Checking payment:', paymentId);

    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    // Check payment status with AbacatePay
    const checkUrl = `https://api.abacatepay.com/v1/pixQrCode/check?id=${paymentId}`;
    console.log('Checking AbacatePay URL:', checkUrl);

    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('AbacatePay check response status:', checkResponse.status);

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      console.error('AbacatePay check error:', errorText);
      throw new Error(`Failed to check payment status: ${checkResponse.status}`);
    }

    const abacatePayData: AbacatePayCheckResponse = await checkResponse.json();
    console.log('AbacatePay check response:', JSON.stringify(abacatePayData, null, 2));

    if (abacatePayData.error) {
      throw new Error(`AbacatePay error: ${JSON.stringify(abacatePayData.error)}`);
    }

    const isPaid = abacatePayData.data.status === 'APPROVED' || abacatePayData.data.status === 'PAID';
    console.log('Payment status:', abacatePayData.data.status, 'isPaid:', isPaid);

    // If payment is approved, update the transaction and user plan
    if (isPaid) {
      // Get transaction details to know which user and plan
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('user_id, plan_name, amount')
        .eq('abacate_payment_id', paymentId)
        .single();

      if (transactionError || !transaction) {
        console.error('Error fetching transaction:', transactionError);
        throw new Error('Transaction not found');
      }

      console.log('Transaction found:', transaction);

      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('abacate_payment_id', paymentId);

      if (updateError) {
        console.error('Error updating payment transaction:', updateError);
      } else {
        console.log('Payment transaction updated successfully');
      }

      // Update user plan in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan: transaction.plan_name.toLowerCase() })
        .eq('id', transaction.user_id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      } else {
        console.log('User profile updated successfully');
      }

      // Check if user plan already exists to prevent duplicate commissions
      const { data: existingPlan } = await supabase
        .from('user_plans')
        .select('id')
        .eq('user_id', transaction.user_id)
        .eq('plan_name', transaction.plan_name.toLowerCase())
        .eq('is_active', true)
        .single();

      // Only insert user plan if it doesn't exist (prevents duplicate commission processing)
      if (!existingPlan) {
        const { error: planError } = await supabase
          .from('user_plans')
          .insert({
            user_id: transaction.user_id,
            plan_name: transaction.plan_name.toLowerCase(),
            purchase_date: new Date().toISOString(),
            is_active: true
          });

        if (planError) {
          console.error('Error inserting user plan:', planError);
        } else {
          console.log('User plan inserted successfully - commissions will be processed automatically');
        }
      } else {
        console.log('User plan already exists - skipping commission processing to prevent duplicates');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: abacatePayData.data.status,
        isPaid,
        expiresAt: abacatePayData.data.expiresAt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Check payment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});