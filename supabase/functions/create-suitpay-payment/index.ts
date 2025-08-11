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

interface SuitPayResponse {
  idTransaction: string
  paymentCode: string
  response: string
  paymentCodeBase64: string
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
    const suitpayApiUrl = Deno.env.get('SUITPAY_API_URL') || 'https://ws.suitpay.app'

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const paymentRequest: PaymentRequest = await req.json()
    console.log('SuitPay payment request:', paymentRequest)

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

    // Generate unique request number
    const requestNumber = `bulltec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate due date (24 hours from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)
    const dueDateString = dueDate.toISOString().split('T')[0] // YYYY-MM-DD format

    // Prepare SuitPay payload
    const suitpayPayload = {
      requestNumber: requestNumber,
      dueDate: dueDateString,
      amount: paymentRequest.amount,
      shippingAmount: 0.0,
      discountAmount: 0.0,
      usernameCheckout: 'bulltec',
      callbackUrl: `${supabaseUrl}/functions/v1/suitpay-webhook`,
      client: {
        name: paymentRequest.customer_name,
        document: paymentRequest.customer_document,
        phoneNumber: paymentRequest.customer_phone || '11999999999',
        email: paymentRequest.customer_email,
        address: {
          codIbge: '3550308', // São Paulo - SP
          street: 'Rua Exemplo',
          number: '123',
          complement: '',
          zipCode: '01000-000',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP'
        }
      },
      products: [
        {
          description: `Plano ${paymentRequest.plan_name.toUpperCase()} - BullTec`,
          quantity: 1,
          value: paymentRequest.amount
        }
      ]
    }

    console.log('SuitPay payload:', JSON.stringify(suitpayPayload, null, 2))

    // Call SuitPay API
    const suitpayResponse = await fetch(`${suitpayApiUrl}/api/v1/gateway/request-qrcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ci': suitpayClientId,
        'cs': suitpayClientSecret
      },
      body: JSON.stringify(suitpayPayload)
    })

    if (!suitpayResponse.ok) {
      const errorText = await suitpayResponse.text()
      console.error('SuitPay API error:', suitpayResponse.status, errorText)
      return new Response(`SuitPay API error: ${errorText}`, { 
        status: suitpayResponse.status,
        headers: corsHeaders 
      })
    }

    const suitpayData: SuitPayResponse = await suitpayResponse.json()
    console.log('SuitPay response:', suitpayData)

    // Store payment transaction in Supabase
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        external_id: requestNumber,
        user_id: paymentRequest.user_id,
        plan_name: paymentRequest.plan_name,
        amount: paymentRequest.amount,
        status: 'pending',
        payment_provider: 'suitpay',
        transaction_data: suitpayData,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing payment transaction:', insertError)
      return new Response('Error storing payment transaction', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Calculate expiration time (24 hours from now)
    const expirationTime = new Date()
    expirationTime.setDate(expirationTime.getDate() + 1)

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      transaction_id: suitpayData.idTransaction,
      qr_code: suitpayData.paymentCode,
      qr_code_base64: suitpayData.paymentCodeBase64,
      amount: paymentRequest.amount,
      expires_at: expirationTime.toISOString(),
      request_number: requestNumber
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('SuitPay payment error:', error)
    return new Response('Payment processing failed', {
      headers: corsHeaders,
      status: 500
    })
  }
})