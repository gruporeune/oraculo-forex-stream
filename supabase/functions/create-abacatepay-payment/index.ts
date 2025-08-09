import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  planName: string;
  amount: number;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  userCpf?: string;
}

interface AbacatePayResponse {
  data?: {
    id: string;
    amount: number;
    status: string;
    devMode: boolean;
    brCode: string;
    brCodeBase64: string;
    platformFee: number;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };
  error: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasApiKey: !!abacatePayApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!abacatePayApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const paymentData: PaymentRequest = await req.json();
    console.log('Payment data received:', paymentData);

    // Create external ID
    const externalId = `payment_${Date.now()}_${paymentData.userId}`;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile data including phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', paymentData.userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Use profile data or fallback to provided data
    const customerData = {
      name: profile?.full_name || paymentData.userName,
      cellphone: profile?.phone || paymentData.userPhone || "11999999999", // Fallback phone
      email: paymentData.userEmail,
      taxId: paymentData.userCpf || "000.000.000-00" // Fallback CPF - should be provided by user
    };

    console.log('Customer data for AbacatePay:', customerData);

    // Create payment with AbacatePay
    const abacatePayPayload = {
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      expiresIn: 3600, // 1 hour expiration
      description: `Plano ${paymentData.planName} - BullTec`,
      customer: customerData,
      metadata: {
        externalId: externalId
      }
    };

    console.log('Sending to AbacatePay:', abacatePayPayload);
    console.log('API Key being used:', abacatePayApiKey ? `${abacatePayApiKey.substring(0, 10)}...` : 'NOT SET');

    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacatePayApiKey}`,
      },
      body: JSON.stringify(abacatePayPayload),
    });

    console.log('AbacatePay response status:', abacatePayResponse.status);
    console.log('AbacatePay response headers:', Object.fromEntries(abacatePayResponse.headers.entries()));

    const responseText = await abacatePayResponse.text();
    console.log('AbacatePay raw response:', responseText);

    if (!abacatePayResponse.ok) {
      console.error('AbacatePay error:', abacatePayResponse.status, responseText);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pagamento na AbacatePay' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const abacatePayResult: AbacatePayResponse = JSON.parse(responseText);
    console.log('AbacatePay parsed response:', abacatePayResult);

    if (abacatePayResult.error || !abacatePayResult.data) {
      console.error('AbacatePay API error:', abacatePayResult.error);
      return new Response(
        JSON.stringify({ error: abacatePayResult.error || 'Erro desconhecido da AbacatePay' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store payment transaction in database
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: paymentData.userId,
        plan_name: paymentData.planName,
        amount: paymentData.amount,
        external_id: externalId,
        qr_code: abacatePayResult.data.brCode,
        qr_code_text: abacatePayResult.data.brCode,
        status: 'pending'
      });

    if (insertError) {
      console.error('Error inserting payment transaction:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar transação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: abacatePayResult.data.id,
        qrCode: abacatePayResult.data.brCode,
        qrCodeImage: abacatePayResult.data.brCodeBase64,
        amount: paymentData.amount,
        expiresAt: abacatePayResult.data.expiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});