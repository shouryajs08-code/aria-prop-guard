const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const update = await req.json()
    console.log('Telegram webhook received:', JSON.stringify(update))

    const message = update?.message
    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const chatId = message.chat.id.toString()
    const text = message.text.trim()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set')
      return new Response(JSON.stringify({ error: 'Bot not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (text === '/start') {
      // Reply with confirmation
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ <b>ARIA PropGuard alerts activated!</b>\n\nYou\'ll receive breach warnings here.\n\nYour Chat ID: <code>' + chatId + '</code>\n\nCopy this Chat ID and paste it in the Alerts settings page to connect your account.',
          parse_mode: 'HTML',
        }),
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
