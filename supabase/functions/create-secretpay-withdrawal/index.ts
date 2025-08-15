import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WithdrawalRequest {
  amount: number;
  pixKey: string;
  fullName: string;
  userId: string;
}

interface SecretPayTransferResponse {
  status: string;
  message: string;
  data?: {
    id: string;
    reference: string;
    status: string;
    amount: number;
    currency: string;
    beneficiary: {
      name: string;
      pix_key: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const secretpayPrivateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { amount, pixKey, fullName, userId }: WithdrawalRequest = await req.json();

    // Fetch user profile to verify balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('available_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.available_balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Saldo insuficiente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate external reference
    const externalRef = `WD_${Date.now()}_${userId.substring(0, 8)}`;

    // Create SecretPay transfer payload
    const transferPayload = {
      amount: amount,
      currency: "BRL",
      reference: externalRef,
      beneficiary: {
        name: fullName,
        pix_key: pixKey,
        account_type: "PIX"
      },
      description: `Saque solicitado - ${fullName}`,
      webhook_url: `${supabaseUrl}/functions/v1/secretpay-withdrawal-webhook`
    };

    console.log('Creating SecretPay transfer:', transferPayload);

    // Call SecretPay API
    const secretpayResponse = await fetch('https://api.secretpay.io/v2/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretpayPrivateKey}`,
      },
      body: JSON.stringify(transferPayload),
    });

    const secretpayData: SecretPayTransferResponse = await secretpayResponse.json();

    console.log('SecretPay response:', secretpayData);

    if (!secretpayResponse.ok) {
      console.error('SecretPay API error:', secretpayData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro no processamento do saque via SecretPay',
          details: secretpayData.message || 'Erro desconhecido'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update withdrawal request with SecretPay data
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        secretpay_transfer_id: secretpayData.data?.id || externalRef,
        transfer_data: secretpayData,
        status: 'processing'
      })
      .eq('user_id', userId)
      .eq('amount', amount)
      .eq('pix_key', pixKey)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Error updating withdrawal request:', updateError);
    }

    // Deduct amount from user balance
    const newBalance = profile.available_balance - amount;
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ available_balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar saldo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        transferId: secretpayData.data?.id,
        reference: externalRef,
        status: secretpayData.data?.status || 'processing',
        message: 'Saque enviado para processamento via SecretPay'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-secretpay-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});