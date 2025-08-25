import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 DEBUG: Function started')
    
    // Test environment variables
    const publicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')
    const privateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')
    
    console.log('🔍 DEBUG Keys:', {
      publicKey: publicKey ? `Found: ${publicKey.substring(0, 10)}...` : 'NOT FOUND',
      privateKey: privateKey ? `Found: ${privateKey.substring(0, 10)}...` : 'NOT FOUND'
    })

    if (!publicKey || !privateKey) {
      console.error('❌ MISSING KEYS')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Chaves não encontradas',
          debug: {
            publicKey: !!publicKey,
            privateKey: !!privateKey,
            allEnvKeys: Object.keys(Deno.env.toObject())
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Get request data
    const requestData = await req.json()
    console.log('📝 DEBUG Request:', requestData)

    // Simple test payload
    const testPayload = {
      amount: 20000, // R$ 200.00 in cents  
      externalRef: `test_${Date.now()}`,
      paymentMethod: "pix",
      customer: {
        name: requestData.userName || "Test User",
        email: requestData.userEmail || "test@test.com",
        phone: requestData.userPhone || "11999999999",
        document: {
          type: "CPF", 
          number: (requestData.userDocument || "12345678901").replace(/\D/g, '')
        }
      },
      items: [{
        name: "Plano Test",
        value: 20000,
        quantity: 1,
        tangible: false
      }]
    }

    console.log('📋 DEBUG Payload:', JSON.stringify(testPayload, null, 2))

    // Test SecretPay API call
    const credentials = btoa(`${publicKey}:${privateKey}`)
    console.log('🔐 DEBUG Auth:', `Basic ${credentials.substring(0, 20)}...`)

    const response = await fetch('https://api.secretpay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })

    console.log('📡 DEBUG Response status:', response.status)
    
    const responseText = await response.text()
    console.log('📡 DEBUG Response body:', responseText)

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `API Error: ${response.status}`,
          details: responseText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const apiData = JSON.parse(responseText)
    console.log('✅ DEBUG Success:', apiData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teste realizado com sucesso!',
        data: apiData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ DEBUG Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro no teste',
        details: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})