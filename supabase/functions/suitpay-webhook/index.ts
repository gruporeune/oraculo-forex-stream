import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuitPayWebhook {
  idTransaction: string
  typeTransaction: string
  statusTransaction: string
  value: number
  payerName: string
  payerTaxId: string
  paymentDate: string
  paymentCode: string
  requestNumber: string
  hash: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const suitpayClientSecret = Deno.env.get('SUITPAY_CLIENT_SECRET')!

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook data
    const webhookData: SuitPayWebhook = await req.json()
    
    console.log('SuitPay webhook received:', webhookData)

    // Validate webhook hash for security
    const fieldsToHash = [
      webhookData.idTransaction,
      webhookData.typeTransaction,
      webhookData.statusTransaction,
      webhookData.value.toString(),
      webhookData.payerName,
      webhookData.payerTaxId,
      webhookData.paymentDate,
      webhookData.paymentCode,
      webhookData.requestNumber
    ].join('')

    const dataToHash = fieldsToHash + suitpayClientSecret
    
    // Create SHA-256 hash
    const encoder = new TextEncoder()
    const data = encoder.encode(dataToHash)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (calculatedHash !== webhookData.hash) {
      console.error('Invalid webhook hash - possible security breach')
      return new Response('Invalid hash', { status: 401 })
    }

    // Find the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', webhookData.requestNumber)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', webhookData.requestNumber, fetchError)
      return new Response('Transaction not found', { status: 404 })
    }

    // Map SuitPay status to our internal status
    let internalStatus = 'pending'
    if (webhookData.statusTransaction === 'PAID_OUT') {
      internalStatus = 'paid'
    } else if (webhookData.statusTransaction === 'CHARGEBACK') {
      internalStatus = 'failed'
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: internalStatus,
        paid_at: webhookData.statusTransaction === 'PAID_OUT' ? webhookData.paymentDate : null,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', webhookData.requestNumber)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response('Error updating transaction', { status: 500 })
    }

    // If payment is approved, activate the plan
    if (webhookData.statusTransaction === 'PAID_OUT') {
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