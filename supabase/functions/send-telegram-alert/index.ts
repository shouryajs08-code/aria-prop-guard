const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const BodySchema = z.object({
  chat_id: z.string().min(1),
  text: z.string().min(1).max(4096),
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

    const { chat_id, text, user_id, account_id, alert_type, threshold_pct } = parsed.data

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    console.log('Telegram env check:', { hasToken: !!botToken })

    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Telegram bot not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send via Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode: 'HTML',
      }),
    })

    const telegramData = await telegramResponse.json()

    if (!telegramResponse.ok) {
      console.error('Telegram error:', telegramData)
      return new Response(JSON.stringify({ error: 'Failed to send Telegram message', details: telegramData }), {
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
        message: text,
        channel: 'telegram',
        sent_at: new Date().toISOString(),
      }),
    })

    return new Response(JSON.stringify({ success: true, message_id: telegramData.result?.message_id }), {
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
