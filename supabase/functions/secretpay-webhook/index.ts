import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecretPayWebhook {
  id: string
  status: string
  amount: number
  externalRef: string
  customer: {
    name: string
    email: string
    document: string
  }
  paymentMethod: string
  paidAt?: string
  createdAt: string
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
    const webhookData: SecretPayWebhook = await req.json()
    
    console.log('SecretPay webhook received:', webhookData)

    // Find the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', webhookData.externalRef)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', webhookData.externalRef, fetchError)
      return new Response('Transaction not found', { status: 404 })
    }

    // Map SecretPay status to our internal status
    let internalStatus = 'pending'
    if (webhookData.status === 'paid' || webhookData.status === 'approved') {
      internalStatus = 'paid'
    } else if (webhookData.status === 'failed' || webhookData.status === 'cancelled' || webhookData.status === 'refunded') {
      internalStatus = 'failed'
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: internalStatus,
        paid_at: internalStatus === 'paid' ? (webhookData.paidAt || new Date().toISOString()) : null,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', webhookData.externalRef)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response('Error updating transaction', { status: 500 })
    }

    // If payment is approved, activate the plan
    if (internalStatus === 'paid') {
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

      // Check if user plan already exists to prevent duplicate commissions
      const { data: existingPlan } = await supabase
        .from('user_plans')
        .select('id')
        .eq('user_id', transaction.user_id)
        .eq('plan_name', transaction.plan_name)
        .eq('is_active', true)
        .single();

      // Only insert user plan if it doesn't exist (prevents duplicate commission processing)
      if (!existingPlan) {
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
        } else {
          console.log('User plan inserted successfully - commissions will be processed automatically')
        }
      } else {
        console.log('User plan already exists - skipping commission processing to prevent duplicates')
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