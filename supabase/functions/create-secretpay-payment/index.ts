import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  user_id: string
  plan_name: string
  amount: number
  customer_name: string
  customer_email: string
  customer_document: string
  customer_phone?: string
}

interface SecretPayResponse {
  id: string
  status: string
  amount: number
  qrCode?: string
  qrCodeImage?: string
  checkoutUrl?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const secretpayPrivateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')!
    const secretpayPublicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')!

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const paymentRequest: PaymentRequest = await req.json()
    console.log('SecretPay payment request:', paymentRequest)

    // Get user profile for additional customer data
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', paymentRequest.user_id)
      .single()

    if (!userProfile) {
      return new Response('User profile not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Generate unique external reference
    const externalRef = `bulltec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert amount to centavos (SecretPay expects amount in cents)
    const amountInCents = Math.round(paymentRequest.amount * 100)

    // Prepare SecretPay payload
    const secretpayPayload = {
      amount: amountInCents,
      paymentMethod: "pix",
      pix: {
        expiresIn: 3600 // 1 hour in seconds
      },
      items: [
        {
          title: `Plano ${paymentRequest.plan_name.toUpperCase()} - BullTec`,
          unitPrice: amountInCents,
          quantity: 1,
          tangible: false
        }
      ],
      customer: {
        name: paymentRequest.customer_name,
        email: paymentRequest.customer_email,
        document: {
          type: "cpf",
          number: paymentRequest.customer_document
        },
        phone: paymentRequest.customer_phone || '11999999999'
      },
      postbackUrl: `${supabaseUrl}/functions/v1/secretpay-webhook`,
      externalRef: externalRef,
      metadata: `Plano ${paymentRequest.plan_name} - Usuario ${paymentRequest.user_id}`
    }

    console.log('SecretPay payload:', JSON.stringify(secretpayPayload, null, 2))

    // Create Basic Auth header
    const credentials = btoa(`${secretpayPublicKey}:${secretpayPrivateKey}`)
    
    // Call SecretPay API
    const secretpayResponse = await fetch('https://api.secretpay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(secretpayPayload)
    })

    if (!secretpayResponse.ok) {
      const errorText = await secretpayResponse.text()
      console.error('SecretPay API error:', secretpayResponse.status, errorText)
      return new Response(`SecretPay API error: ${errorText}`, { 
        status: secretpayResponse.status,
        headers: corsHeaders 
      })
    }

    const secretpayData: SecretPayResponse = await secretpayResponse.json()
    console.log('SecretPay response:', secretpayData)

    // Store payment transaction in Supabase
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        external_id: externalRef,
        user_id: paymentRequest.user_id,
        plan_name: paymentRequest.plan_name,
        amount: paymentRequest.amount,
        status: 'pending',
        payment_provider: 'secretpay',
        transaction_data: secretpayData,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing payment transaction:', insertError)
      return new Response('Error storing payment transaction', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Calculate expiration time (1 hour from now)
    const expirationTime = new Date()
    expirationTime.setHours(expirationTime.getHours() + 1)

    // Return success response adapted to current frontend structure
    return new Response(JSON.stringify({
      success: true,
      transaction_id: secretpayData.id,
      qr_code: secretpayData.qrCode || '',
      qr_code_base64: secretpayData.qrCodeImage || '',
      amount: paymentRequest.amount,
      expires_at: expirationTime.toISOString(),
      request_number: externalRef
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('SecretPay payment error:', error)
    return new Response('Payment processing failed', {
      headers: corsHeaders,
      status: 500
    })
  }
})