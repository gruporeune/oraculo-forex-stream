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

    const {
      user_id,
      plan_name,
      amount,
      customer_name,
      customer_email,
      customer_document,
      customer_phone
    } = await req.json();

    console.log('Creating Asaas payment for:', { user_id, plan_name, amount });

    // Criar cobrança PIX na Asaas
    const asaasResponse = await fetch('https://api.asaas.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify({
        billingType: 'PIX',
        value: amount,
        description: `Plano ${plan_name.toUpperCase()} - ORÁCULO`,
        externalReference: user_id,
        dueDate: new Date().toISOString().split('T')[0],
        customer: {
          name: customer_name,
          email: customer_email,
          cpfCnpj: customer_document,
          mobilePhone: customer_phone
        }
      })
    });

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text();
      console.error('Asaas API error:', errorText);
      throw new Error(`Asaas API error: ${errorText}`);
    }

    const asaasData = await asaasResponse.json();
    console.log('Asaas payment created:', asaasData);

    // Buscar dados do QR Code PIX
    const pixResponse = await fetch(`https://api.asaas.com/v3/payments/${asaasData.id}/pixQrCode`, {
      headers: {
        'access_token': asaasApiKey
      }
    });

    if (!pixResponse.ok) {
      const errorText = await pixResponse.text();
      console.error('Asaas PIX QR Code error:', errorText);
      throw new Error(`Failed to get PIX QR Code: ${errorText}`);
    }

    const pixData = await pixResponse.json();
    console.log('PIX QR Code data:', pixData);

    // Salvar transação no banco
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user_id,
        external_id: asaasData.id,
        plan_name: plan_name.toLowerCase(),
        amount: amount,
        status: 'pending',
        payment_provider: 'asaas',
        qr_code: pixData.payload,
        qr_code_text: pixData.payload,
        transaction_data: {
          asaas_payment_id: asaasData.id,
          invoice_url: asaasData.invoiceUrl,
          due_date: asaasData.dueDate,
          expires_date: pixData.expirationDate
        }
      });

    if (insertError) {
      console.error('Error inserting payment transaction:', insertError);
      throw new Error('Failed to save payment transaction');
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: asaasData.id,
        qr_code: pixData.payload,
        qr_code_image: pixData.encodedImage,
        amount: amount,
        expires_at: pixData.expirationDate,
        invoice_url: asaasData.invoiceUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-asaas-payment:', error);
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
