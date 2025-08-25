import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      plan_name, 
      amount, 
      customer_name, 
      customer_email, 
      customer_document, 
      customer_phone,
      tangible = false,
      customer_cep = "88000000",
      customer_city = "Florianópolis",
      customer_neighborhood = "Centro",
      customer_street = "Rua Principal",
      customer_number = "123",
      customer_complement = "",
      customer_state = "SC"
    } = await req.json();

    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user profile to validate
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique external reference
    const externalReference = `${user_id}-${plan_name}-${Date.now()}`;

    // Convert amount to cents (Faturefy expects integer in cents)
    const amountInCents = Math.round(amount * 100);

    // Validate minimum amount (R$ 5.00 = 500 centavos)
    if (amountInCents < 500) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valor mínimo de R$ 5,00' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean and validate CPF (remove any formatting)
    const cleanDocument = customer_document.replace(/\D/g, '');
    if (cleanDocument.length !== 11) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'CPF deve ter exatamente 11 dígitos' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean and format phone (remove any formatting, NO country code for Faturefy)
    const cleanPhone = customer_phone.replace(/\D/g, '');
    // For Faturefy, phone should be without +55 prefix
    const formattedPhone = cleanPhone.length === 13 && cleanPhone.startsWith('55') ? 
                          cleanPhone.substring(2) : 
                          cleanPhone.length === 11 ? cleanPhone : cleanPhone;

    // Payload format exactly as specified by Faturefy documentation
    const faturefyPayload = {
      amount: amountInCents, // Integer em centavos
      description: `Plano ${plan_name.toUpperCase()} - Oráculo Trading`,
      tangible: tangible, // Adicionar o campo tangible no payload principal
      customer: {
        name: customer_name.trim(),
        email: customer_email.toLowerCase().trim(),
        document: cleanDocument, // CPF válido
        phone: formattedPhone // Sem +55
      },
      id_solicitacao: "auto" // Sistema gera automaticamente
    };

    // Adicionar dados de endereço apenas se for produto físico (tangible = true)
    if (tangible) {
      faturefyPayload.customer.cep = customer_cep.replace(/\D/g, '');
      faturefyPayload.customer.cidade = customer_city.trim();
      faturefyPayload.customer.bairro = customer_neighborhood.trim();
      faturefyPayload.customer.rua = customer_street.trim();
      faturefyPayload.customer.numero = customer_number.toString();
      faturefyPayload.customer.complemento = customer_complement || "";
      faturefyPayload.customer.estado = customer_state.toUpperCase().trim();
    }

    console.log('Creating Faturefy payment with payload:', JSON.stringify(faturefyPayload, null, 2));
    
    // Debug token information
    const token = Deno.env.get('FATUREFY_API_TOKEN');
    console.log('Using Faturefy token:', token ? `${token.substring(0, 10)}...` : 'TOKEN NOT FOUND');
    console.log('API URL:', 'https://api.faturefy.site/api-pix/new-pix-invoice');

    // Call Faturefy API
    const faturefyResponse = await fetch('https://api.faturefy.site/api-pix/new-pix-invoice', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(faturefyPayload)
    });

    console.log('Faturefy response status:', faturefyResponse.status);
    console.log('Faturefy response headers:', Object.fromEntries(faturefyResponse.headers.entries()));

    if (!faturefyResponse.ok) {
      const errorText = await faturefyResponse.text();
      console.error('Faturefy API error details:');
      console.error('Status:', faturefyResponse.status);
      console.error('Status Text:', faturefyResponse.statusText);
      console.error('Response Body:', errorText);
      console.error('Request Payload was:', JSON.stringify(faturefyPayload, null, 2));
      
      // Try alternative payload format
      console.log('Trying alternative payload format...');
      
      const alternativePayload = {
        valor: amountInCents, // Some APIs use 'valor' instead of 'amount'
        descricao: `Plano ${plan_name.toUpperCase()} - Oráculo Trading`,
        cliente: {
          nome: customer_name.trim(),
          email: customer_email.toLowerCase().trim(),
          cpf: cleanDocument,
          telefone: formattedPhone
        },
        endereco: {
          cep: customer_cep.replace(/\D/g, ''),
          cidade: customer_city.trim(),
          bairro: customer_neighborhood.trim(),
          rua: customer_street.trim(),
          numero: customer_number.toString(),
          complemento: customer_complement || "",
          uf: customer_state.toUpperCase().trim()
        }
      };

      const alternativeResponse = await fetch('https://api.faturefy.site/api-pix/new-pix-invoice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(alternativePayload)
      });

      if (!alternativeResponse.ok) {
        const altErrorText = await alternativeResponse.text();
        console.error('Alternative payload also failed:', alternativeResponse.status, altErrorText);
        
        // Try minimal payload
        console.log('Trying minimal payload format...');
        
        const minimalPayload = {
          amount: amountInCents,
          description: `Plano ${plan_name.toUpperCase()}`,
          customer_name: customer_name.trim(),
          customer_email: customer_email.toLowerCase().trim(),
          customer_document: cleanDocument,
          customer_phone: formattedPhone
        };

        const minimalResponse = await fetch('https://api.faturefy.site/api-pix/new-pix-invoice', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(minimalPayload)
        });

        if (!minimalResponse.ok) {
          const minErrorText = await minimalResponse.text();
          console.error('Minimal payload also failed:', minimalResponse.status, minErrorText);
          
          let errorMessage = 'Erro na API de pagamento';
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            } else if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch (e) {
            console.log('Could not parse error response as JSON');
          }
          
          return new Response(JSON.stringify({ 
            success: false, 
            error: errorMessage,
            details: `Original: ${errorText}, Alt: ${altErrorText}, Min: ${minErrorText}`
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // Minimal payload worked, use its response
          const minimalData = await minimalResponse.json();
          console.log('Minimal payload successful:', JSON.stringify(minimalData, null, 2));
          
          // Continue with the successful response data
          if (!minimalData.data) {
            console.error('Invalid minimal response structure:', minimalData);
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Resposta inválida da API de pagamento' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Store payment transaction using minimal response data
          const transactionData = {
            user_id,
            amount,
            external_id: minimalData.data.idSolicitacao || minimalData.data.transactionId || `min-${Date.now()}`,
            plan_name: plan_name.toLowerCase(),
            status: 'pending',
            payment_provider: 'faturefy',
            qr_code: minimalData.data.pixCode,
            qr_code_text: minimalData.data.pixCode,
            transaction_data: {
              ...minimalData.data,
              payload_type: 'minimal',
              customer_data: {
                name: customer_name,
                email: customer_email,
                document: cleanDocument,
                phone: formattedPhone
              }
            }
          };

          const { error: insertError } = await supabase
            .from('payment_transactions')
            .insert(transactionData);

          if (insertError) {
            console.error('Error inserting minimal transaction:', insertError);
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Erro ao salvar transação' 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({
            success: true,
            transaction_id: minimalData.data.transactionId || minimalData.data.idSolicitacao,
            qr_code: minimalData.data.pixCode,
            qr_code_image: minimalData.data.pixQrCode,
            amount: amount,
            request_number: minimalData.data.idSolicitacao,
            status: minimalData.data.status || 'pending',
            generated_at: minimalData.data.generatedAt || new Date().toISOString()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Alternative payload worked
        const alternativeData = await alternativeResponse.json();
        console.log('Alternative payload successful:', JSON.stringify(alternativeData, null, 2));
        
        if (!alternativeData.data) {
          console.error('Invalid alternative response structure:', alternativeData);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Resposta inválida da API de pagamento' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Store payment transaction using alternative response data  
        const transactionData = {
          user_id,
          amount,
          external_id: alternativeData.data.idSolicitacao || alternativeData.data.transactionId || `alt-${Date.now()}`,
          plan_name: plan_name.toLowerCase(),
          status: 'pending',
          payment_provider: 'faturefy',
          qr_code: alternativeData.data.pixCode,
          qr_code_text: alternativeData.data.pixCode,
          transaction_data: {
            ...alternativeData.data,
            payload_type: 'alternative',
            customer_data: {
              name: customer_name,
              email: customer_email,
              document: cleanDocument,
              phone: formattedPhone
            }
          }
        };

        const { error: insertError } = await supabase
          .from('payment_transactions')
          .insert(transactionData);

        if (insertError) {
          console.error('Error inserting alternative transaction:', insertError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Erro ao salvar transação' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          transaction_id: alternativeData.data.transactionId || alternativeData.data.idSolicitacao,
          qr_code: alternativeData.data.pixCode,
          qr_code_image: alternativeData.data.pixQrCode,
          amount: amount,
          request_number: alternativeData.data.idSolicitacao,
          status: alternativeData.data.status || 'pending',
          generated_at: alternativeData.data.generatedAt || new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const faturefyData = await faturefyResponse.json();
    console.log('Faturefy response:', JSON.stringify(faturefyData, null, 2));

    if (!faturefyData.data) {
      console.error('Invalid Faturefy response structure:', faturefyData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Resposta inválida da API de pagamento' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store payment transaction in database
    const transactionData = {
      user_id,
      amount,
      external_id: faturefyData.data.idSolicitacao,
      plan_name: plan_name.toLowerCase(),
      status: 'pending',
      payment_provider: 'faturefy',
      qr_code: faturefyData.data.pixCode,
      qr_code_text: faturefyData.data.pixCode,
      transaction_data: {
        transactionId: faturefyData.data.transactionId,
        pixCode: faturefyData.data.pixCode,
        pixQrCode: faturefyData.data.pixQrCode,
        status: faturefyData.data.status,
        generatedAt: faturefyData.data.generatedAt,
        idSolicitacao: faturefyData.data.idSolicitacao,
        customer_data: {
          name: customer_name,
          email: customer_email,
          document: customer_document,
          phone: customer_phone
        }
      }
    };

    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert(transactionData);

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao salvar transação' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return success response
    const responseData = {
      success: true,
      transaction_id: faturefyData.data.transactionId,
      qr_code: faturefyData.data.pixCode,
      qr_code_image: faturefyData.data.pixQrCode, // This is the base64 QR code image
      amount: amount,
      request_number: faturefyData.data.idSolicitacao,
      status: faturefyData.data.status,
      generated_at: faturefyData.data.generatedAt
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-faturefy-payment:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});