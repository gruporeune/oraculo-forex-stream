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

    console.log('Creating Asaas payment for:', { user_id, plan_name, amount, customer_email });

    // Passo 1: Criar ou buscar cliente na Asaas
    let customerId;
    
    // Primeiro, tentar buscar se o cliente já existe
    const searchResponse = await fetch(`https://api.asaas.com/v3/customers?email=${encodeURIComponent(customer_email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Customer search result:', searchData);
      
      if (searchData.data && searchData.data.length > 0) {
        // Cliente já existe
        customerId = searchData.data[0].id;
        console.log('Using existing customer:', customerId);
      }
    }

    // Se não encontrou, criar novo cliente
    if (!customerId) {
      console.log('Creating new customer in Asaas');
      const customerResponse = await fetch('https://api.asaas.com/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify({
          name: customer_name,
          email: customer_email,
          cpfCnpj: customer_document,
          mobilePhone: customer_phone,
          externalReference: user_id
        })
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('Asaas customer creation error:', errorText);
        throw new Error(`Failed to create customer: ${errorText}`);
      }

      const customerData = await customerResponse.json();
      customerId = customerData.id;
      console.log('Customer created:', customerId);
    }

    // Passo 2: Criar cobrança PIX com o ID do cliente
    const today = new Date();
    const dueDate = new Date(today.getTime() + (24 * 60 * 60 * 1000)); // +1 dia
    const dueDateStr = dueDate.toISOString().split('T')[0];

    console.log('Creating payment with customer:', customerId);
    const paymentResponse = await fetch('https://api.asaas.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: amount,
        dueDate: dueDateStr,
        description: `Plano ${plan_name.toUpperCase()} - ORÁCULO`,
        externalReference: user_id
      })
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Asaas payment creation error:', errorText);
      throw new Error(`Asaas API error: ${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('Payment created:', paymentData);

    // Passo 3: Buscar dados do QR Code PIX
    const pixResponse = await fetch(`https://api.asaas.com/v3/payments/${paymentData.id}/pixQrCode`, {
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
    console.log('PIX QR Code data received');

    // Passo 4: Salvar transação no banco
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user_id,
        external_id: paymentData.id,
        plan_name: plan_name.toLowerCase(),
        amount: amount,
        status: 'pending',
        payment_provider: 'asaas',
        qr_code: pixData.payload,
        qr_code_text: pixData.payload,
        transaction_data: {
          asaas_payment_id: paymentData.id,
          asaas_customer_id: customerId,
          invoice_url: paymentData.invoiceUrl,
          due_date: paymentData.dueDate,
          expires_date: pixData.expirationDate
        }
      });

    if (insertError) {
      console.error('Error inserting payment transaction:', insertError);
      throw new Error('Failed to save payment transaction');
    }

    console.log('Payment transaction saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentData.id,
        qr_code: pixData.payload,
        qr_code_image: pixData.encodedImage,
        amount: amount,
        expires_at: pixData.expirationDate,
        invoice_url: paymentData.invoiceUrl
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
