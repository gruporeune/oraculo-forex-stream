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
    console.log('🧪 TESTE SecretPay - FORMATO OFICIAL')
    
    const publicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')
    const privateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')
    
    console.log('🔑 Chaves:', {
      public: publicKey ? `${publicKey.substring(0, 10)}...` : 'FALTANDO',
      private: privateKey ? `${privateKey.substring(0, 10)}...` : 'FALTANDO'
    })

    if (!publicKey || !privateKey) {
      throw new Error('Chaves SecretPay não encontradas')
    }

    const requestData = await req.json()
    console.log('📥 Dados recebidos:', requestData)

    // PAYLOAD OFICIAL DA SECRETPAY (baseado na documentação oficial)
    const payload = {
      amount: 20000, // Valor em centavos (R$ 200.00)
      paymentMethod: "pix", // Método de pagamento
      items: [
        {
          name: "Plano Partner",
          unitPrice: 20000, // Preço unitário em centavos
          quantity: 1,
          tangible: false // Produto digital
        }
      ],
      customer: {
        name: requestData.userName || "Teste User",
        email: requestData.userEmail || "teste@teste.com",
        phone: requestData.userPhone || "11999999999",
        document: (requestData.userDocument || "12345678901").replace(/\D/g, '')
      },
      postbackUrl: "https://nzxidhlktjpzkxhofswx.supabase.co/functions/v1/payment-webhook",
      externalRef: `test_${Date.now()}`
    }

    console.log('📦 Payload OFICIAL:', JSON.stringify(payload, null, 2))

    const credentials = btoa(`${publicKey}:${privateKey}`)
    console.log('🔐 Auth header:', `Basic ${credentials.substring(0, 20)}...`)
    
    const response = await fetch('https://api.secretpay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 Corpo da resposta:', responseText)

    let responseJson = null
    try {
      responseJson = JSON.parse(responseText)
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido')
    }

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      responseText: responseText,
      responseJson: responseJson,
      testInfo: {
        payloadSent: payload,
        credentialsUsed: {
          publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'MISSING',
          privateKey: privateKey ? `${privateKey.substring(0, 10)}...` : 'MISSING'
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('💥 Erro:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})