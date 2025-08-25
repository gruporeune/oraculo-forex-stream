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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Creating SecretPay payment...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const publicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')
    const privateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')

    console.log('🔍 Environment check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'NOT SET',
      publicKey: publicKey ? `SET (${publicKey.substring(0, 6)}...)` : 'NOT SET',
      privateKey: privateKey ? `SET (${privateKey.substring(0, 6)}...)` : 'NOT SET'
    })

    // Validate credentials
    if (!publicKey || !privateKey) {
      console.error('❌ SecretPay credentials not configured')
      console.error('❌ Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('SECRET')))
      throw new Error('Credenciais SecretPay não configuradas')
    }

    if (!publicKey.startsWith('pk_') || !privateKey.startsWith('sk_')) {
      console.error('❌ Invalid SecretPay credential format')
      throw new Error('Formato de credenciais SecretPay inválido')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { plan, userEmail, userName, userDocument, userPhone }: PaymentRequest = await req.json()

    console.log('📝 Request data:', { plan, userEmail, userName })

    // Plan prices in BRL
    const planPrices: Record<string, number> = {
      partner: 200,
      master: 600,
      premium: 2750,
      platinum: 5000
    }

    const amount = planPrices[plan]
    if (!amount) {
      throw new Error('Plano inválido selecionado')
    }

    // Generate unique external ID
    const externalId = `${plan}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // SecretPay payload - original format that was working
    const payload = {
      amount: Math.round(amount * 100), // Amount in cents
      externalRef: externalId,
      paymentMethod: "pix",
      postbackUrl: `${supabaseUrl}/functions/v1/payment-webhook`,
      customer: {
        name: userName,
        email: userEmail,
        phone: userPhone || '',
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

    console.log('📋 SecretPay payload:', JSON.stringify(payload, null, 2))

    // Create Basic Auth credentials
    const credentials = btoa(`${publicKey}:${privateKey}`)

    // Call SecretPay API
    const response = await fetch('https://api.secretpay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📡 SecretPay response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ SecretPay API error:', errorText)
      throw new Error(`Erro na API SecretPay: ${response.status}`)
    }

    const secretPayData = await response.json()
    console.log('✅ SecretPay response:', secretPayData)

    // Get user by email for payment tracking
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(userEmail)
    
    if (user?.user) {
      // Store payment transaction
      const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.user.id,
          external_id: externalId,
          plan_name: plan,
          amount: amount,
          status: 'pending',
          payment_provider: 'secretpay',
          qr_code: secretPayData.pix?.qrCodeImage || secretPayData.qrCode,
          qr_code_text: secretPayData.pix?.qrCode || secretPayData.pixCode,
          transaction_data: secretPayData
        })

      if (insertError) {
        console.error('❌ Error storing payment:', insertError)
      } else {
        console.log('✅ Payment transaction stored')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          qr_code: secretPayData.pix?.qrCodeImage || secretPayData.qrCode,
          qr_code_text: secretPayData.pix?.qrCode || secretPayData.pixCode,
          external_id: externalId,
          amount: amount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Payment creation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})