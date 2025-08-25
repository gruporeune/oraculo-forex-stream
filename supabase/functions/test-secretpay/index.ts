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
    console.log('🧪 TESTE SIMPLES SecretPay')
    
    const publicKey = Deno.env.get('SECRETPAY_PUBLIC_KEY')
    const privateKey = Deno.env.get('SECRETPAY_PRIVATE_KEY')
    
    console.log('🔑 Chaves:', {
      public: publicKey ? 'OK' : 'FALTANDO',
      private: privateKey ? 'OK' : 'FALTANDO'
    })

    if (!publicKey || !privateKey) {
      throw new Error('Chaves não encontradas')
    }

    // Payload mínimo para teste
    const payload = {
      amount: 20000,
      externalRef: `test_${Date.now()}`,
      paymentMethod: "pix",
      customer: {
        name: "Teste User",
        email: "teste@teste.com",
        phone: "11999999999",
        document: {
          type: "CPF",
          number: "12345678901"
        }
      },
      items: [{
        name: "Teste",
        value: 20000,
        quantity: 1
      }]
    }

    console.log('📦 Payload:', JSON.stringify(payload, null, 2))

    const credentials = btoa(`${publicKey}:${privateKey}`)
    
    const response = await fetch('https://api.secretpay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📊 Status:', response.status)
    
    const result = await response.text()
    console.log('📄 Resposta:', result)

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Erro:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})