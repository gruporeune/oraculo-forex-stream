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
    const { 
      user_id, 
      plan_name, 
      amount, 
      customer_name, 
      customer_email, 
      customer_document, 
      customer_phone,
      customer_cep = "88000000",
      customer_city = "Florianópolis",
      customer_neighborhood = "Centro",
      customer_street = "Rua Principal",
      customer_number = "123",
      customer_complement = "",
      customer_state = "SC"
    } = await req.json();

    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user profile to validate
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique external reference
    const externalReference = `${user_id}-${plan_name}-${Date.now()}`;

    // Convert amount to cents (Faturefy expects integer in cents)
    const amountInCents = Math.round(amount * 100);

    // Validate minimum amount (R$ 5.00 = 500 centavos)
    if (amountInCents < 500) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valor mínimo de R$ 5,00' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare Faturefy API request
    const faturefyPayload = {
      amount: amountInCents,
      description: `Plano ${plan_name} - Oráculo Trading`,
      customer: {
        name: customer_name,
        email: customer_email,
        document: customer_document,
        phone: customer_phone,
        cep: customer_cep,
        cidade: customer_city,
        bairro: customer_neighborhood,
        rua: customer_street,
        numero: customer_number,
        complemento: customer_complement,
        estado: customer_state
      },
      id_solicitacao: "auto" // Let Faturefy generate the ID
    };

    console.log('Creating Faturefy payment with payload:', JSON.stringify(faturefyPayload, null, 2));
    
    // Debug token information
    const token = Deno.env.get('FATUREFY_API_TOKEN');
    console.log('Using Faturefy token:', token ? `${token.substring(0, 10)}...` : 'TOKEN NOT FOUND');
    console.log('API URL:', 'https://api.faturefy.site/api-pix/new-pix-invoice');

    // Call Faturefy API
    const faturefyResponse = await fetch('https://api.faturefy.site/api-pix/new-pix-invoice', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(faturefyPayload)
    });

    console.log('Faturefy response status:', faturefyResponse.status);
    console.log('Faturefy response headers:', Object.fromEntries(faturefyResponse.headers.entries()));

    if (!faturefyResponse.ok) {
      const errorText = await faturefyResponse.text();
      console.error('Faturefy API error details:');
      console.error('Status:', faturefyResponse.status);
      console.error('Status Text:', faturefyResponse.statusText);
      console.error('Response Body:', errorText);
      console.error('Request Payload was:', JSON.stringify(faturefyPayload, null, 2));
      
      let errorMessage = 'Erro na API de pagamento';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        // Se não conseguir fazer parse do JSON, usa a mensagem padrão
        console.log('Could not parse error response as JSON');
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: errorText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const faturefyData = await faturefyResponse.json();
    console.log('Faturefy response:', JSON.stringify(faturefyData, null, 2));

    if (!faturefyData.data) {
      console.error('Invalid Faturefy response structure:', faturefyData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Resposta inválida da API de pagamento' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store payment transaction in database
    const transactionData = {
      user_id,
      amount,
      external_id: faturefyData.data.idSolicitacao,
      plan_name: plan_name.toLowerCase(),
      status: 'pending',
      payment_provider: 'faturefy',
      qr_code: faturefyData.data.pixCode,
      qr_code_text: faturefyData.data.pixCode,
      transaction_data: {
        transactionId: faturefyData.data.transactionId,
        pixCode: faturefyData.data.pixCode,
        pixQrCode: faturefyData.data.pixQrCode,
        status: faturefyData.data.status,
        generatedAt: faturefyData.data.generatedAt,
        idSolicitacao: faturefyData.data.idSolicitacao,
        customer_data: {
          name: customer_name,
          email: customer_email,
          document: customer_document,
          phone: customer_phone
        }
      }
    };

    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert(transactionData);

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao salvar transação' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return success response
    const responseData = {
      success: true,
      transaction_id: faturefyData.data.transactionId,
      qr_code: faturefyData.data.pixCode,
      qr_code_image: faturefyData.data.pixQrCode, // This is the base64 QR code image
      amount: amount,
      request_number: faturefyData.data.idSolicitacao,
      status: faturefyData.data.status,
      generated_at: faturefyData.data.generatedAt
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-faturefy-payment:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});