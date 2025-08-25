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

// Função para gerar HMAC SHA-256
async function generateHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando processamento de saque SecretPay');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const publicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')!;
    const privateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { amount, pixKey, fullName, userId }: WithdrawalRequest = await req.json();

    console.log(`💰 Processando saque: R$ ${amount} para ${fullName}`);

    // Validar dados obrigatórios
    if (!amount || !pixKey || !fullName || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar valor mínimo
    if (amount < 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor mínimo para saque é R$ 50,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar perfil do usuário para verificar saldo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('available_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Usuário não encontrado:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.available_balance < amount) {
      console.error('❌ Saldo insuficiente');
      return new Response(
        JSON.stringify({ success: false, error: 'Saldo insuficiente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 1: Processar saque com taxa de 5%
    const fee = amount * 0.05;
    const netAmount = amount - fee;

    console.log(`💸 Valor líquido após taxa de 5%: R$ ${netAmount.toFixed(2)} (Taxa: R$ ${fee.toFixed(2)})`);

    // ETAPA 2: Criar saque na SecretPay
    console.log('💸 Enviando transferência PIX...');

    // Dados da transferência PIX conforme documentação SecretPay
    const transferPayload = {
      method: "PIX",
      amount: Math.round(netAmount * 100), // Valor em centavos
      netPayout: false, // Taxa já foi descontada
      pixKey: pixKey,
      pixKeyType: "CPF", // Será definido dinamicamente pelo tipo selecionado
      postbackUrl: `${supabaseUrl}/functions/v1/secretpay-withdrawal-webhook`
    };

    console.log('📋 Payload de transferência:', transferPayload);

    const transferResponse = await fetch('https://api.secretpay.com.br/v1/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${publicKey}:${privateKey}`)}`,
        'x-withdraw-key': privateKey, // Chave de saque externo
        'accept': 'application/json',
      },
      body: JSON.stringify(transferPayload),
    });

    const transferData = await transferResponse.json();
    console.log('📋 Resposta da transferência:', transferData);

    if (!transferResponse.ok || !transferData.worked) {
      console.error('❌ Erro na transferência:', transferData);
      
      // Log detalhado do erro
      const errorDetails = {
        status: transferResponse.status,
        response: transferData,
        payload: transferPayload
      };
      console.error('❌ Detalhes do erro:', JSON.stringify(errorDetails, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: transferData.erro_descriptor || transferData.new_erro_descriptor || 'Erro na transferência PIX',
          details: transferData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 3: Atualizar saldo do usuário
    const newBalance = profile.available_balance - amount;
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ available_balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      console.error('❌ Erro ao atualizar saldo:', balanceError);
      // Em um cenário real, aqui seria necessário implementar reversão da transferência
    }

    // ETAPA 4: Atualizar status da solicitação de saque
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        secretpay_transfer_id: transferData.transaction_id?.toString() || transferData.id?.toString(),
        transfer_data: transferData,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('amount', amount)
      .eq('pix_key', pixKey)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('❌ Erro ao atualizar withdrawal_request:', updateError);
    }

    console.log('✅ Saque processado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        transferId: transferData.transaction_id || transferData.id,
        netAmount: netAmount,
        fee: fee,
        message: 'Saque processado com sucesso via PIX'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral no processamento do saque:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});