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
  userPhone?: string
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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const secretpayPrivateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')!
    const secretpayPublicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')!

    console.log('SecretPay credentials check:', {
      hasPublicKey: !!secretpayPublicKey,
      hasPrivateKey: !!secretpayPrivateKey,
      publicKeyLength: secretpayPublicKey ? secretpayPublicKey.length : 0,
      privateKeyLength: secretpayPrivateKey ? secretpayPrivateKey.length : 0,
      publicKeyPreview: secretpayPublicKey ? secretpayPublicKey.substring(0, 8) + '...' : 'not found',
      privateKeyPreview: secretpayPrivateKey ? secretpayPrivateKey.substring(0, 8) + '...' : 'not found'
    })

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

    // Get user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(userEmail)
    if (userError || !user?.user) {
      console.error('Error getting user:', userError)
      throw new Error('User not found')
    }

    // Generate unique external reference
    const externalRef = `bulltec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert amount to centavos (SecretPay expects amount in cents)
    const amountInCents = Math.round(amount * 100)
    console.log('Amount in cents calculated:', amountInCents)
    
    // Validate CPF format (11 digits)
    const cpfNumbers = userDocument.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      console.error('Invalid CPF length:', cpfNumbers.length)
      throw new Error('Invalid CPF format')
    }
    
    // Format phone number
    let phoneNumber = userPhone?.replace(/\D/g, '') || ''
    if (phoneNumber.length < 10) {
      phoneNumber = '11999999999' // Default phone
    } else if (phoneNumber.length === 10) {
      phoneNumber = '55' + phoneNumber
    } else if (phoneNumber.length === 11 && !phoneNumber.startsWith('55')) {
      phoneNumber = '55' + phoneNumber
    }

    // Prepare SecretPay payload
    const secretpayPayload = {
      amount: amountInCents,
      paymentMethod: "pix",
      pix: {
        expiresIn: 3600
      },
      items: [
        {
          title: `Plano ${plan.toUpperCase()} - BullTec`,
          unitPrice: amountInCents,
          quantity: 1,
          tangible: false
        }
      ],
      customer: {
        name: userName,
        email: userEmail,
        document: userDocument,
        phone: phoneNumber
      },
      postbackUrl: `${supabaseUrl}/functions/v1/secretpay-webhook`,
      externalRef: externalRef,
      metadata: `Plano ${plan} - Usuario ${user.user.id}`
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
      throw new Error(`Erro na API SecretPay: ${secretpayResponse.status}`)
    }

    const secretpayData: SecretPayResponse = await secretpayResponse.json()
    console.log('SecretPay response:', secretpayData)

    // Store payment transaction in Supabase
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        external_id: externalRef,
        user_id: user.user.id,
        plan_name: plan,
        amount: amount,
        status: 'pending',
        payment_provider: 'secretpay',
        transaction_data: secretpayData,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing payment transaction:', insertError)
      throw new Error('Error storing payment transaction')
    }

    // Calculate expiration time (1 hour from now)
    const expirationTime = new Date()
    expirationTime.setHours(expirationTime.getHours() + 1)

    // Extract PIX data from SecretPay response
    const pixCode = secretpayData.pix?.qrcode || ''
    
    // Generate QR Code image URL using a QR code service
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`

    return new Response(JSON.stringify({
      success: true,
      transaction_id: secretpayData.id,
      qr_code: pixCode,
      qr_code_base64: '',
      qr_code_image: qrCodeImageUrl,
      amount: amount,
      expires_at: expirationTime.toISOString(),
      request_number: externalRef
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('SecretPay payment error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})