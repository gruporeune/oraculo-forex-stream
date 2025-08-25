import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎣 SecretPay webhook received')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const webhookData = await req.json()
    console.log('📋 Webhook data:', JSON.stringify(webhookData, null, 2))

    // Extract external reference from webhook
    const externalRef = webhookData.data?.externalRef || webhookData.externalRef
    const status = webhookData.data?.status || webhookData.status

    if (!externalRef) {
      console.error('❌ No external reference found in webhook')
      return new Response('No external reference found', { status: 400 })
    }

    console.log('🔍 Looking for transaction:', externalRef, 'with status:', status)

    // Find the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', externalRef)
      .eq('payment_provider', 'secretpay')
      .single()

    if (fetchError || !transaction) {
      console.error('❌ Transaction not found:', externalRef, fetchError)
      return new Response('Transaction not found', { status: 404 })
    }

    // Map SecretPay status to our internal status
    let internalStatus = 'pending'
    if (status === 'paid' || status === 'approved' || status === 'completed') {
      internalStatus = 'paid'
    } else if (status === 'failed' || status === 'cancelled' || status === 'refunded') {
      internalStatus = 'failed'
    }

    console.log(`📊 Updating transaction ${externalRef}: ${transaction.status} → ${internalStatus}`)

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: internalStatus,
        paid_at: internalStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', externalRef)

    if (updateError) {
      console.error('❌ Error updating transaction:', updateError)
      return new Response('Error updating transaction', { status: 500 })
    }

    // If payment is approved, activate the plan
    if (internalStatus === 'paid') {
      console.log('💰 Payment approved! Activating plan:', transaction.plan_name)

      // Update user profile with new plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan: transaction.plan_name.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.user_id)

      if (profileError) {
        console.error('❌ Error updating profile:', profileError)
      }

      // Check if user already has 5 plans (maximum allowed)
      const { data: userPlans } = await supabase
        .from('user_plans')
        .select('id')
        .eq('user_id', transaction.user_id)
        .eq('is_active', true)

      const planCount = userPlans?.length || 0

      if (planCount < 5) {
        // Create user plan record
        const { error: planError } = await supabase
          .from('user_plans')
          .insert({
            user_id: transaction.user_id,
            plan_name: transaction.plan_name.toLowerCase(),
            purchase_date: new Date().toISOString(),
            is_active: true
          })

        if (planError) {
          console.error('❌ Error creating user plan:', planError)
        } else {
          console.log('✅ User plan created - referral commissions will be processed automatically')
        }
      } else {
        console.log('⚠️ User already has maximum number of plans (5)')
      }

      console.log('✅ Plan activated successfully!')
    }

    return new Response('Webhook processed successfully', {
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response('Webhook processing failed', {
      headers: corsHeaders,
      status: 500
    })
  }
})