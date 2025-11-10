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
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('secretpay_transfer_id', transfer.id)
      .single();

    if (fetchError || !withdrawal) {
      console.error('❌ Withdrawal request not found for transfer ID:', transfer.id);
      return new Response(JSON.stringify({ error: 'Withdrawal not found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    console.log('✅ Withdrawal found:', withdrawal.id);

    let newStatus = withdrawal.status;
    
    // Processar diferentes eventos da Asaas
    switch (event) {
      case 'TRANSFER_CREATED':
        newStatus = 'processing';
        console.log('📤 Transfer created, marking as processing');
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
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: newStatus,
        transfer_data: transfer,
        processed_at: new Date().toISOString(),
        admin_notes: `Status atualizado via webhook: ${event}`
      })
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
