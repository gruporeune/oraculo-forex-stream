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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('🔔 Asaas Withdrawal webhook received at:', new Date().toISOString());
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const { event, transfer } = payload;

    if (!event || !transfer) {
      console.error('❌ Missing event or transfer data');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`🎯 Processing withdrawal event: ${event} for transfer ID: ${transfer.id}`);

    // Buscar solicitação de saque no banco
    console.log(`🔍 Searching for withdrawal with transfer ID: ${transfer.id}`);
    
    let withdrawal = null;
    let fetchError = null;

    // Primeira tentativa: buscar pelo transfer_id
    const { data: withdrawalById, error: errorById } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('secretpay_transfer_id', transfer.id)
      .maybeSingle();

    if (errorById) {
      console.error('❌ Database error fetching withdrawal:', errorById);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Database error',
          error: errorById.message 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    withdrawal = withdrawalById;

    // Se não encontrou pelo transfer_id, tentar busca inteligente
    if (!withdrawal) {
      console.log('🔍 Transfer ID not found, trying smart search with amount, pix_key and status...');
      
      // Extrair PIX key do transfer
      const pixKey = transfer.bankAccount?.pixAddressKey;
      const amount = transfer.value;
      
      if (pixKey && amount) {
        console.log(`🔎 Searching by: amount=${amount}, pix_key=${pixKey}`);
        
        // Buscar saques pendentes ou em processamento com mesmo valor e PIX key
        const { data: withdrawalByDetails, error: errorByDetails } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('amount', amount)
          .eq('pix_key', pixKey.replace(/^\+55/, '')) // Remove +55 do início se existir
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (errorByDetails) {
          console.error('❌ Error in smart search:', errorByDetails);
        } else if (withdrawalByDetails) {
          withdrawal = withdrawalByDetails;
          console.log('✅ Found withdrawal via smart search!', withdrawal.id);
          
          // Atualizar o registro com o transfer_id correto
          await supabase
            .from('withdrawal_requests')
            .update({ secretpay_transfer_id: transfer.id })
            .eq('id', withdrawal.id);
          
          console.log('💾 Updated withdrawal with correct transfer_id');
        }
      }
    }

    if (!withdrawal) {
      console.error('❌ Withdrawal request not found even with smart search');
      console.log('💡 Transfer data:', JSON.stringify({
        id: transfer.id,
        amount: transfer.value,
        pixKey: transfer.bankAccount?.pixAddressKey,
        status: transfer.status
      }));
      
      // Return 200 to prevent Asaas from pausing webhook
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Withdrawal not found in database - webhook acknowledged',
          transfer_id: transfer.id 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log('✅ Withdrawal found:', withdrawal.id);

    let newStatus = withdrawal.status;
    
    // Processar diferentes eventos da Asaas
    switch (event) {
      case 'TRANSFER_CREATED':
        newStatus = 'processing';
        console.log('📤 Transfer created, marking as processing');
        break;
      
      case 'TRANSFER_PENDING':
        newStatus = 'processing';
        console.log('⏳ Transfer pending authorization');
        break;
      
      case 'TRANSFER_AUTHORIZED':
        newStatus = 'processing';
        console.log('✅ Transfer authorized (approved), processing...');
        break;
      
      case 'TRANSFER_BANK_PROCESSING':
        newStatus = 'processing';
        console.log('🏦 Transfer being processed by bank');
        break;
      
      case 'TRANSFER_DONE':
      case 'TRANSFER_CONFIRMED':
        newStatus = 'completed';
        console.log('✅ Transfer confirmed, marking as completed');
        break;
      
      case 'TRANSFER_FAILED':
      case 'TRANSFER_CANCELLED':
      case 'TRANSFER_REJECTED':
        newStatus = 'rejected';
        console.log('❌ Transfer failed/cancelled/rejected');
        
        // Devolver saldo ao usuário
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('available_balance')
          .eq('id', withdrawal.user_id)
          .single();

        if (!profileError && userProfile) {
          const newBalance = (userProfile.available_balance || 0) + withdrawal.amount;
          await supabase
            .from('profiles')
            .update({ available_balance: newBalance })
            .eq('id', withdrawal.user_id);
          
          console.log(`💰 Balance returned to user: R$ ${withdrawal.amount}`);
        }
        break;
      
      default:
        console.log(`ℹ️ Unhandled event: ${event}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Event not processed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
    }

    // Atualizar status da solicitação
    const updateData: any = {
      status: newStatus,
      transfer_data: transfer,
      admin_notes: `Status atualizado via webhook: ${event} em ${new Date().toISOString()}`
    };

    // Só atualizar processed_at quando completar ou rejeitar
    if (newStatus === 'completed' || newStatus === 'rejected') {
      updateData.processed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('❌ Error updating withdrawal:', updateError);
      throw updateError;
    }

    console.log('🎉 Withdrawal status updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('💥 Error in asaas-withdrawal-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})
