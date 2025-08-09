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
    const paylatamClientId = Deno.env.get('PAYLATAM_CLIENT_ID')
    const paylatamClientSecret = Deno.env.get('PAYLATAM_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log('Environment check:', {
      hasPaylatamClientId: !!paylatamClientId,
      hasPaylatamClientSecret: !!paylatamClientSecret,
      clientIdLength: paylatamClientId ? paylatamClientId.length : 0,
      clientSecretLength: paylatamClientSecret ? paylatamClientSecret.length : 0,
      clientIdPrefix: paylatamClientId ? paylatamClientId.substring(0, 8) + '...' : 'not found',
      clientSecretPrefix: paylatamClientSecret ? paylatamClientSecret.substring(0, 4) + '...' : 'not found'
    })

    if (!paylatamClientId) {
      console.error('PayLatam Client ID not configured')
      throw new Error('PayLatam Client ID not configured')
    }

    if (!paylatamClientSecret) {
      console.error('PayLatam Client Secret not configured')
      throw new Error('PayLatam Client Secret not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, generate access token with Basic Auth
    const credentials = `${paylatamClientId}:${paylatamClientSecret}`
    const encodedCredentials = btoa(credentials)
    
    console.log('Step 1: Generating access token...')
    const tokenResponse = await fetch('https://api.paylatambr.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token generation failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorText: errorText
      })
      throw new Error(`Token generation failed: ${tokenResponse.status} - ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    console.log('Access token generated successfully:', {
      hasToken: !!accessToken,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    })

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

    // Prepare PayLatam payload (without client_id in body)
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

    console.log('Step 2: Creating PayLatam PIX QR Code...', {
      amount,
      plan,
      externalId,
      userEmail,
      payloadKeys: Object.keys(paylatamPayload)
    })

    // Call PayLatam API with Bearer token
    const paylatamResponse = await fetch('https://api.paylatambr.com/v2/pix/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paylatamPayload)
    })

    console.log('PayLatam API call completed:', {
      status: paylatamResponse.status,
      statusText: paylatamResponse.statusText,
      ok: paylatamResponse.ok
    })

    console.log('PayLatam response status:', paylatamResponse.status)

    if (!paylatamResponse.ok) {
      const errorText = await paylatamResponse.text()
      console.error('PayLatam API error:', {
        status: paylatamResponse.status,
        statusText: paylatamResponse.statusText,
        errorText: errorText
      })
      throw new Error(`PayLatam API error: ${paylatamResponse.status} - ${errorText}`)
    }

    const paylatamData = await paylatamResponse.json()
    console.log('PayLatam response data:', paylatamData)

    // Store payment record in database for tracking
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(userEmail)
    
    if (userError) {
      console.error('Error getting user:', userError)
    }
    
    if (user?.user) {
      // Create a payment tracking record
      const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.user.id,
          external_id: externalId,
          plan_name: plan,
          amount: amount,
          status: 'pending',
          paylatam_transaction_id: paylatamData.transaction_id || paylatamData.data?.transaction_id || null,
          qr_code: paylatamData.qr_code || paylatamData.data?.qr_code || null,
          qr_code_text: paylatamData.qr_code_text || paylatamData.data?.qr_code_text || null
        })

      if (insertError) {
        console.error('Error storing payment record:', insertError)
      }
    } else {
      console.log('User not found for email:', userEmail)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          qr_code: paylatamData.qr_code || paylatamData.data?.qr_code,
          qr_code_text: paylatamData.qr_code_text || paylatamData.data?.qr_code_text,
          transaction_id: paylatamData.transaction_id || paylatamData.data?.transaction_id,
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