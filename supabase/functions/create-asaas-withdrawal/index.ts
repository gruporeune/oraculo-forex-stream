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
      withdrawal_request_id,
      amount,
      pix_key,
      pix_key_type,
      full_name,
      user_document
    } = await req.json();

    console.log('Creating Asaas withdrawal for request:', withdrawal_request_id);

    // Buscar solicitação de saque
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_request_id)
      .single();

    if (fetchError || !withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    // Criar transferência PIX na Asaas
    const asaasResponse = await fetch('https://api.asaas.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify({
        value: amount,
        pixAddressKey: pix_key,
        pixAddressKeyType: pix_key_type.toUpperCase(), // CPF, CNPJ, EMAIL, PHONE, EVP
        description: `Saque ORÁCULO - ${full_name}`,
        scheduleDate: null // Transfer imediato
      })
    });

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text();
      console.error('Asaas API error:', errorText);
      throw new Error(`Asaas API error: ${errorText}`);
    }

    const asaasData = await asaasResponse.json();
    console.log('Asaas transfer created:', asaasData);

    // Atualizar solicitação de saque com ID da transferência
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        secretpay_transfer_id: asaasData.id,
        transfer_data: asaasData,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawal_request_id);

    if (updateError) {
      console.error('Error updating withdrawal request:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: asaasData.id,
        status: asaasData.status,
        message: 'Withdrawal processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-asaas-withdrawal:', error);
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
