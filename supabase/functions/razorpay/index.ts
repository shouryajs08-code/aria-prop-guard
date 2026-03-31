import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAZORPAY_BASE = 'https://api.razorpay.com/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
  if (!RAZORPAY_KEY_ID) {
    return new Response(JSON.stringify({ error: 'RAZORPAY_KEY_ID not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
  if (!RAZORPAY_KEY_SECRET) {
    return new Response(JSON.stringify({ error: 'RAZORPAY_KEY_SECRET not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token)
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const userId = claims.claims.sub as string

  try {
    const { action, ...body } = await req.json()
    const rzpAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

    if (action === 'create_order') {
      // Create Razorpay order for ₹1,999
      const res = await fetch(`${RAZORPAY_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${rzpAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 199900, // paise
          currency: 'INR',
          receipt: `aria_${userId.slice(0, 8)}_${Date.now()}`,
        }),
      })
      const order = await res.json()
      if (!res.ok) {
        throw new Error(`Razorpay order failed [${res.status}]: ${JSON.stringify(order)}`)
      }

      return new Response(JSON.stringify({ order_id: order.id, key_id: RAZORPAY_KEY_ID, amount: 199900 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

      // Verify signature
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(RAZORPAY_KEY_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      )
      const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`))
      const expectedSig = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

      if (expectedSig !== razorpay_signature) {
        return new Response(JSON.stringify({ error: 'Invalid payment signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Update subscription to active
      await supabase
        .from('subscriptions')
        .update({ status: 'active', razorpay_subscription_id: razorpay_payment_id })
        .eq('user_id', userId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
