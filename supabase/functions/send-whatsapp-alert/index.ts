import { corsHeaders } from '@supabase/supabase-js/cors'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const BodySchema = z.object({
  to: z.string().min(10).max(20),
  body: z.string().min(1).max(1600),
  user_id: z.string().uuid(),
  account_id: z.string().uuid(),
  alert_type: z.string(),
  threshold_pct: z.number(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { to, body, user_id, account_id, alert_type, threshold_pct } = parsed.data

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM')

    if (!accountSid || !authToken || !fromNumber) {
      return new Response(JSON.stringify({ error: 'Twilio not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send WhatsApp via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${fromNumber}`,
        Body: body,
      }),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData)
      return new Response(JSON.stringify({ error: 'Failed to send WhatsApp', details: twilioData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log alert in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    await fetch(`${supabaseUrl}/rest/v1/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id,
        account_id,
        alert_type,
        threshold_pct,
        message: body,
        channel: 'whatsapp',
        sent_at: new Date().toISOString(),
      }),
    })

    return new Response(JSON.stringify({ success: true, sid: twilioData.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
