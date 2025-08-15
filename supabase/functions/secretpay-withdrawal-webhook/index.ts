import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecretPayWithdrawalWebhookData {
  id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  beneficiary: {
    name: string;
    pix_key: string;
  };
  created_at: string;
  updated_at: string;
}

interface SecretPayWithdrawalWebhook {
  event: string;
  data: SecretPayWithdrawalWebhookData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData: SecretPayWithdrawalWebhook = await req.json();
    console.log('SecretPay withdrawal webhook received:', webhookData);

    const { data: transferData } = webhookData;

    // Find the withdrawal request by reference or secretpay_transfer_id
    const { data: withdrawalRequest, error: findError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .or(`secretpay_transfer_id.eq.${transferData.id},secretpay_transfer_id.eq.${transferData.reference}`)
      .single();

    if (findError || !withdrawalRequest) {
      console.error('Withdrawal request not found:', findError);
      return new Response(
        JSON.stringify({ error: 'Withdrawal request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map SecretPay status to our internal status
    let internalStatus = 'processing';
    switch (transferData.status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
        internalStatus = 'completed';
        break;
      case 'failed':
      case 'error':
      case 'cancelled':
        internalStatus = 'rejected';
        break;
      case 'processing':
      case 'pending':
        internalStatus = 'processing';
        break;
    }

    // Update withdrawal request status
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: internalStatus,
        processed_at: internalStatus === 'completed' ? new Date().toISOString() : null,
        transfer_data: webhookData
      })
      .eq('id', withdrawalRequest.id);

    if (updateError) {
      console.error('Error updating withdrawal request:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error updating withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If transfer failed, refund the amount to user's balance
    if (internalStatus === 'rejected') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('available_balance')
        .eq('id', withdrawalRequest.user_id)
        .single();

      if (profile) {
        const refundedBalance = (profile.available_balance || 0) + withdrawalRequest.amount;
        await supabase
          .from('profiles')
          .update({ available_balance: refundedBalance })
          .eq('id', withdrawalRequest.user_id);
        
        console.log(`Refunded ${withdrawalRequest.amount} to user ${withdrawalRequest.user_id}`);
      }
    }

    console.log(`Withdrawal ${withdrawalRequest.id} updated to status: ${internalStatus}`);

    return new Response(
      JSON.stringify({ success: true, status: internalStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secretpay-withdrawal-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});