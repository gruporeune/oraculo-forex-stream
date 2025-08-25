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
  userPhone: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const publicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')!
    const privateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')!

    if (!publicKey || !privateKey) {
      console.error('SecretPay credentials not configured')
      throw new Error('SecretPay credentials not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request data
    const { plan, userEmail, userName, userDocument, userPhone }: PaymentRequest = await req.json()

    console.log('Creating SecretPay payment:', { plan, userEmail, userName })

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

    // Prepare SecretPay payload for PIX payment
    const secretPayPayload = {
      amount: Math.round(amount * 100), // Amount in cents
      externalRef: externalId,
      paymentMethod: "pix",
      postbackUrl: `${supabaseUrl}/functions/v1/secretpay-webhook`,
      customer: {
        name: userName,
        email: userEmail,
        phone: userPhone?.replace(/\D/g, '') || '',
        document: {
          type: "CPF",
          number: userDocument.replace(/\D/g, '')
        }
      },
      items: [{
        name: `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        value: Math.round(amount * 100),
        quantity: 1,
        tangible: false
      }]
    }

    console.log('SecretPay payload:', secretPayPayload)

    // Create Basic Auth credentials
    const credentials = btoa(`${publicKey}:${privateKey}`)

    // Call SecretPay API to create PIX payment
    const secretPayResponse = await fetch('https://api.secretpay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(secretPayPayload)
    })

    console.log('SecretPay response status:', secretPayResponse.status)

    if (!secretPayResponse.ok) {
      const errorText = await secretPayResponse.text()
      console.error('SecretPay API error:', {
        status: secretPayResponse.status,
        statusText: secretPayResponse.statusText,
        errorText: errorText
      })
      throw new Error(`SecretPay API error: ${secretPayResponse.status} - ${errorText}`)
    }

    const secretPayData = await secretPayResponse.json()
    console.log('SecretPay response data:', secretPayData)

    // Get user by email for payment tracking
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
          payment_provider: 'secretpay', 
          qr_code: secretPayData.pix?.qrCodeImage || secretPayData.pixQRCode || secretPayData.qrCode,
          qr_code_text: secretPayData.pix?.qrCode || secretPayData.pixQRCode || secretPayData.qrCode,
          transaction_data: secretPayData
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
          qr_code: secretPayData.pix?.qrCodeImage || secretPayData.pixQRCode || secretPayData.qrCode,
          qr_code_text: secretPayData.pix?.qrCode || secretPayData.pixQRCode || secretPayData.qrCode,
          transaction_id: secretPayData.id || secretPayData.transactionId,
          external_id: externalId,
          amount: amount,
          plan: plan,
          request_number: externalId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating SecretPay payment:', error)
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