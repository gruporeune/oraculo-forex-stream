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

    console.log('🚀 Creating Asaas withdrawal at:', new Date().toISOString());
    console.log('📋 Request ID:', withdrawal_request_id);
    console.log('💰 Amount:', amount);
    console.log('🔑 PIX Key:', pix_key);
    console.log('📝 PIX Key Type:', pix_key_type);

    if (!withdrawal_request_id || !amount || !pix_key || !pix_key_type) {
      throw new Error('Missing required parameters');
    }

    // Buscar solicitação de saque
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_request_id)
      .single();

    if (fetchError || !withdrawal) {
      console.error('❌ Withdrawal not found:', fetchError);
      throw new Error('Withdrawal request not found');
    }

    console.log('✅ Withdrawal found:', withdrawal);

    // Validar status
    if (withdrawal.status !== 'pending') {
      console.error('❌ Withdrawal already processed:', withdrawal.status);
      throw new Error(`Withdrawal already ${withdrawal.status}`);
    }

    // Criar transferência PIX na Asaas
    console.log('📤 Sending request to Asaas API...');
    const asaasPayload = {
      value: amount,
      pixAddressKey: pix_key,
      pixAddressKeyType: pix_key_type.toUpperCase(), // CPF, CNPJ, EMAIL, PHONE, EVP
      description: `Saque ORÁCULO - ${full_name || 'Usuário'}`,
      scheduleDate: null // Transfer imediato
    };
    
    console.log('📦 Asaas payload:', JSON.stringify(asaasPayload, null, 2));

    const asaasResponse = await fetch('https://api.asaas.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(asaasPayload)
    });

    const responseText = await asaasResponse.text();
    console.log('📨 Asaas response status:', asaasResponse.status);
    console.log('📨 Asaas response body:', responseText);

    if (!asaasResponse.ok) {
      console.error('❌ Asaas API error:', responseText);
      
      // Parse error message
      let errorMessage = 'Erro desconhecido';
      let detailedError = responseText;
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errors && errorData.errors.length > 0) {
          const firstError = errorData.errors[0];
          
          // Traduzir erros comuns
          if (firstError.code === 'invalid_action' && firstError.description.includes('Saldo insuficiente')) {
            errorMessage = '⚠️ SALDO INSUFICIENTE NA CONTA ASAAS';
            detailedError = 'A conta Asaas não possui saldo suficiente para realizar esta transferência. Por favor, adicione saldo na sua conta Asaas antes de processar saques.';
          } else {
            errorMessage = firstError.description || firstError.code;
            detailedError = `${firstError.code}: ${firstError.description}`;
          }
        }
      } catch (e) {
        console.error('Error parsing Asaas error:', e);
      }
      
      // Atualizar saque com erro detalhado
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'pending', // Manter como pending para tentar novamente
          admin_notes: `❌ ${errorMessage}\n\n${detailedError}\n\nResposta completa: ${responseText}`
        })
        .eq('id', withdrawal_request_id);
      
      throw new Error(errorMessage);
    }

    const asaasData = JSON.parse(responseText);
    console.log('✅ Asaas transfer created:', asaasData);

    // Atualizar solicitação de saque com ID da transferência
    console.log(`💾 Updating withdrawal ${withdrawal_request_id} with transfer ID: ${asaasData.id}`);
    
    const { data: updateData, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        secretpay_transfer_id: asaasData.id,
        transfer_data: asaasData,
        admin_notes: `✅ Transferência criada na Asaas com ID: ${asaasData.id}\nStatus: ${asaasData.status}\nAguardando aprovação no painel Asaas.`
      })
      .eq('id', withdrawal_request_id)
      .select();

    if (updateError) {
      console.error('❌ Error updating withdrawal request:', updateError);
      throw new Error(`Failed to update withdrawal: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.error('❌ No rows updated for withdrawal:', withdrawal_request_id);
      throw new Error('Failed to update withdrawal record - no rows affected');
    }

    console.log('✅ Withdrawal updated successfully. Transfer ID saved:', updateData[0].secretpay_transfer_id);

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
