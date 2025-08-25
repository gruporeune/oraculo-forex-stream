
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
  pix?: {
    qrcode: string
    end2EndId?: string
    receiptUrl?: string
    expirationDate: string
  }
  customer: {
    name: string
    email: string
    document: {
      type: string
      number: string
    }
  }
  externalRef: string
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
    console.log('=== SECRETPAY PAYMENT DEBUG ===')
    console.log('Plan name received:', paymentRequest.plan_name)
    console.log('Amount received:', paymentRequest.amount, 'type:', typeof paymentRequest.amount)
    console.log('Customer name:', paymentRequest.customer_name)
    console.log('Customer document:', paymentRequest.customer_document)
    console.log('Full request:', JSON.stringify(paymentRequest, null, 2))

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
    console.log('Amount in cents calculated:', amountInCents)
    
    // Special validation for different plans
    if (paymentRequest.plan_name === 'PREMIUM') {
      console.log('=== PREMIUM PLAN PROCESSING ===')
      console.log('Original amount:', paymentRequest.amount)
      console.log('Amount in cents:', amountInCents)
      console.log('Expected: 94900 cents for R$ 949')
    }
    
    // Check for minimum amount (SecretPay might reject very low amounts)
    if (amountInCents < 100) { // Less than R$ 1.00
      console.error('Amount too low:', amountInCents, 'cents')
      return new Response('Amount too low for PIX payment', { 
        status: 400,
        headers: corsHeaders 
      })
    }
    
    // Validate CPF format (11 digits)
    const cpfNumbers = paymentRequest.customer_document.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      console.error('Invalid CPF length:', cpfNumbers.length)
      return new Response('Invalid CPF format', { 
        status: 400,
        headers: corsHeaders 
      })
    }
    
    // Validate and format phone number
    let phoneNumber = paymentRequest.customer_phone?.replace(/\D/g, '') || ''
    if (phoneNumber.length < 10) {
      console.log('Phone too short, using default')
      phoneNumber = '11999999999'
    } else if (phoneNumber.length === 10) {
      phoneNumber = '55' + phoneNumber // Add country code
    } else if (phoneNumber.length === 11 && !phoneNumber.startsWith('55')) {
      phoneNumber = '55' + phoneNumber // Add country code
    }
    console.log('Phone number formatted:', phoneNumber)

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
        phone: phoneNumber
      },
      postbackUrl: `${supabaseUrl}/functions/v1/secretpay-webhook`,
      externalRef: externalRef,
      metadata: `Plano ${paymentRequest.plan_name} - Usuario ${paymentRequest.user_id}`
    }

    console.log('=== SECRETPAY PAYLOAD FINAL ===')
    console.log('Amount in payload:', secretpayPayload.amount)
    console.log('Plan name in title:', secretpayPayload.items[0].title)
    console.log('Customer name:', secretpayPayload.customer.name)
    console.log('Customer document:', secretpayPayload.customer.document.number)
    console.log('Customer phone:', secretpayPayload.customer.phone)
    console.log('Full payload:', JSON.stringify(secretpayPayload, null, 2))

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
      console.error('Request payload was:', JSON.stringify(secretpayPayload, null, 2))
      
      // Log specific 424 errors for debugging
      if (secretpayResponse.status === 424) {
        console.error('Provider error 424 - possible causes:')
        console.error('- Amount might be outside accepted range')
        console.error('- Document validation failed')
        console.error('- Phone number format invalid')
        console.error('- External reference duplicate')
      }
      
      return new Response(`SecretPay API error: ${errorText}`, { 
        status: secretpayResponse.status,
        headers: corsHeaders 
      })
    }

    const secretpayData: SecretPayResponse = await secretpayResponse.json()
    console.log('SecretPay response:', secretpayData)

    // Store payment transaction in Supabase using the actual transaction ID from SecretPay
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

    // Extract PIX data from SecretPay response
    const pixCode = secretpayData.pix?.qrcode || ''
    
    // Generate QR Code image URL using a QR code service
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`

    console.log('PIX Code extracted:', pixCode)
    console.log('QR Code URL generated:', qrCodeImageUrl)

    // Return success response adapted to current frontend structure
    return new Response(JSON.stringify({
      success: true,
      transaction_id: secretpayData.id,
      qr_code: pixCode,
      qr_code_base64: '', // SecretPay doesn't provide base64, we'll use the URL
      qr_code_image: qrCodeImageUrl,
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
