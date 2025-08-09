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
}

interface AbacatePayResponse {
  data?: {
    id: string;
    url: string;
    amount: number;
    status: string;
    brCode: string;
    qrCode: string;
    expiresAt: string;
    customer: {
      id: string;
      metadata: {
        email: string;
        name: string;
      };
    };
  };
  error?: string;
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

    // Create payment with AbacatePay
    const abacatePayPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      externalId: externalId,
      description: `Plano ${paymentData.planName} - BullTec`,
      customer: {
        metadata: {
          email: paymentData.userEmail,
          name: paymentData.userName,
        }
      }
    };

    console.log('Sending to AbacatePay:', abacatePayPayload);

    const abacatePayResponse = await fetch('https://api.abacatepay.com/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacatePayApiKey}`,
      },
      body: JSON.stringify(abacatePayPayload),
    });

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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from the user email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching users:', authError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = authUser.users.find(u => u.email === paymentData.userEmail);
    if (!user) {
      console.error('User not found with email:', paymentData.userEmail);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store payment transaction in database
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_name: paymentData.planName,
        amount: paymentData.amount,
        external_id: externalId,
        payment_id: abacatePayResult.data.id,
        qr_code: abacatePayResult.data.brCode || abacatePayResult.data.qrCode,
        status: 'pending',
        gateway: 'abacatepay',
        gateway_response: abacatePayResult
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
        qrCode: abacatePayResult.data.brCode || abacatePayResult.data.qrCode,
        amount: paymentData.amount,
        expiresAt: abacatePayResult.data.expiresAt,
        paymentUrl: abacatePayResult.data.url
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