import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  plan: string
  userEmail: string
  userName: string
  userDocument: string
}

interface PayLatamResponse {
  success: boolean
  data?: {
    qr_code: string
    qr_code_text: string
    transaction_id: string
    external_id: string
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const paylatamToken = Deno.env.get('PAYLATAM_API_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!paylatamToken) {
      throw new Error('PayLatam API token not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request data
    const { plan, userEmail, userName, userDocument }: PaymentRequest = await req.json()

    // Define plan prices
    const planPrices: Record<string, number> = {
      partner: 200,
      master: 600,
      premium: 2750,
      platinum: 5000
    }

    const amount = planPrices[plan]
    if (!amount) {
      throw new Error('Invalid plan selected')
    }

    // Generate unique external ID
    const externalId = `${plan}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare PayLatam payload
    const paylatamPayload = {
      amount: amount,
      external_id: externalId,
      payerQuestion: `Pagamento do plano ${plan.toUpperCase()} - BullTec`,
      payer: {
        name: userName,
        document: userDocument,
        email: userEmail
      },
      postbackUrl: `${supabaseUrl}/functions/v1/payment-webhook`
    }

    console.log('Creating PayLatam payment:', {
      amount,
      plan,
      externalId,
      userEmail
    })

    // Call PayLatam API
    const paylatamResponse = await fetch('https://api.paylatambr.com/v2/pix/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paylatamToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paylatamPayload)
    })

    if (!paylatamResponse.ok) {
      const errorText = await paylatamResponse.text()
      console.error('PayLatam API error:', errorText)
      throw new Error(`PayLatam API error: ${paylatamResponse.status}`)
    }

    const paylatamData = await paylatamResponse.json()
    console.log('PayLatam response:', paylatamData)

    // Store payment record in database for tracking
    const { data: user } = await supabase.auth.admin.getUserByEmail(userEmail)
    
    if (user?.user) {
      // Create a payment tracking record (we'll create this table)
      const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.user.id,
          external_id: externalId,
          plan_name: plan,
          amount: amount,
          status: 'pending',
          paylatam_transaction_id: paylatamData.data?.transaction_id || null,
          qr_code: paylatamData.data?.qr_code || null,
          qr_code_text: paylatamData.data?.qr_code_text || null
        })

      if (insertError) {
        console.error('Error storing payment record:', insertError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          qr_code: paylatamData.data?.qr_code,
          qr_code_text: paylatamData.data?.qr_code_text,
          transaction_id: paylatamData.data?.transaction_id,
          external_id: externalId,
          amount: amount,
          plan: plan
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})