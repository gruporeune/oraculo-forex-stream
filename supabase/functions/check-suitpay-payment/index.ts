import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const suitpayClientId = Deno.env.get('SUITPAY_CLIENT_ID')!
    const suitpayClientSecret = Deno.env.get('SUITPAY_CLIENT_SECRET')!
    const suitpayApiUrl = Deno.env.get('SUITPAY_API_URL')!.replace(/\/$/, '')

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { payment_id, user_id } = await req.json()

    if (!payment_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing payment_id or user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log('Checking SuitPay payment status:', payment_id, 'for user:', user_id)

    // First, find the transaction in our database
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', payment_id)
      .eq('user_id', user_id)
      .eq('payment_provider', 'suitpay')
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', payment_id, fetchError)
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Check current status in database first
    if (transaction.status === 'paid') {
      return new Response(JSON.stringify({ 
        status: 'paid',
        message: 'Payment already confirmed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Try to query SuitPay API to check payment status
    try {
      // Use multiple endpoints to try to find the transaction
      const consultEndpoints = [
        `${suitpayApiUrl}/api/v1/gateway/consult-qrcode`,
        `${suitpayApiUrl}/api/v1/gateway/consult-pix`,
        `${suitpayApiUrl}/api/v1/gateway/get-transaction-status`
      ];

      let suitpayData = null;
      
      for (const endpoint of consultEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`)
          const suitpayResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ci': suitpayClientId,
              'cs': suitpayClientSecret,
            },
            body: JSON.stringify({
              requestNumber: payment_id,
              idTransaction: payment_id
            })
          });

          if (suitpayResponse.ok) {
            suitpayData = await suitpayResponse.json();
            console.log(`Success with endpoint: ${endpoint}`, suitpayData);
            break;
          } else {
            console.log(`Failed with endpoint: ${endpoint}`, suitpayResponse.status);
          }
        } catch (endpointError) {
          console.log(`Error with endpoint: ${endpoint}`, endpointError);
          continue;
        }
      }

      if (suitpayData) {
        // If SuitPay says it's paid, update our database
        if (suitpayData.statusTransaction === 'PAID_OUT' || suitpayData.status === 'PAID_OUT') {
          console.log('Payment confirmed by SuitPay API, updating database')

          // Update transaction status
          const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id)

          if (updateError) {
            console.error('Error updating transaction:', updateError)
          } else {
            // Update user profile with new plan
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                plan: transaction.plan_name.toLowerCase(),
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.user_id)

            if (profileError) {
              console.error('Error updating user profile:', profileError)
            }

            // Check if user plan already exists
            const { data: existingPlan } = await supabase
              .from('user_plans')
              .select('id')
              .eq('user_id', transaction.user_id)
              .eq('plan_name', transaction.plan_name.toLowerCase())
              .eq('is_active', true)
              .single()

            // Only insert user plan if it doesn't exist
            if (!existingPlan) {
              const { error: planError } = await supabase
                .from('user_plans')
                .insert({
                  user_id: transaction.user_id,
                  plan_name: transaction.plan_name.toLowerCase(),
                  purchase_date: new Date().toISOString(),
                  is_active: true
                })

              if (planError) {
                console.error('Error creating user plan record:', planError)
              } else {
                console.log('User plan inserted successfully')
              }
            }

            console.log('Plan activated successfully for user:', transaction.user_id)
          }

          return new Response(JSON.stringify({ 
            status: 'paid',
            message: 'Payment confirmed and plan activated'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          })
        } else {
          console.log('Payment not yet confirmed by SuitPay:', suitpayData)
        }
      } else {
        console.log('No valid response from any SuitPay endpoint')
      }
    } catch (apiError) {
      console.error('Error checking SuitPay API:', apiError)
    }

    // Return current status from database
    return new Response(JSON.stringify({ 
      status: transaction.status,
      message: 'Payment status checked'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Payment check error:', error)
    return new Response(JSON.stringify({ error: 'Payment check failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})