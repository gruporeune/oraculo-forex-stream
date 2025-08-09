import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayLatamWebhook {
  external_id: string
  status: string
  transaction_id: string
  amount: number
  paid_at?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook data
    const webhookData: PayLatamWebhook = await req.json()
    
    console.log('PayLatam webhook received:', webhookData)

    // Find the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', webhookData.external_id)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', webhookData.external_id, fetchError)
      return new Response('Transaction not found', { status: 404 })
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: webhookData.status,
        paid_at: webhookData.paid_at || null,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', webhookData.external_id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response('Error updating transaction', { status: 500 })
    }

    // If payment is approved, activate the plan
    if (webhookData.status === 'approved' || webhookData.status === 'paid') {
      console.log('Payment approved, activating plan:', transaction.plan_name, 'for user:', transaction.user_id)

      // Update user profile with new plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan: transaction.plan_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.user_id)

      if (profileError) {
        console.error('Error updating user profile:', profileError)
      }

      // Create user_plans record to trigger commission system
      const { error: planError } = await supabase
        .from('user_plans')
        .insert({
          user_id: transaction.user_id,
          plan_name: transaction.plan_name,
          purchase_date: new Date().toISOString(),
          is_active: true
        })

      if (planError) {
        console.error('Error creating user plan record:', planError)
      }

      console.log('Plan activated successfully for user:', transaction.user_id)
    }

    return new Response('Webhook processed successfully', {
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing failed', {
      headers: corsHeaders,
      status: 500
    })
  }
})