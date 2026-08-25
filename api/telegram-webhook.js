const WEB_APP = (process.env.NUXT_WEB_APP_URL || 'https://trashhh14.github.io/find-me-quest/').replace(/\/?$/, '/')
const TOKEN = process.env.NUXT_BOT_TOKEN

function isStart(text) {
  return typeof text === 'string' && /^\/start(?:@\w+)?(?:\s|$)/.test(text.trim())
}

async function telegram(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(200).json({ ok: true, service: 'find-me-quest-bot' })
    return
  }
  if (!TOKEN) {
    res.status(200).json({ ok: true, skipped: 'no-token' })
    return
  }

  const update = req.body || {}
  const message = update.message
  if (!isStart(message?.text) || !message?.chat?.id) {
    res.status(200).json({ ok: true })
    return
  }

  await telegram('sendPhoto', {
    chat_id: message.chat.id,
    photo: `${WEB_APP}assets/quest-invitation.png`,
    caption: 'Я уехал и оставил для тебя маршрут. Готова меня найти?',
    reply_markup: {
      inline_keyboard: [[{ text: 'Открыть квест ✦', web_app: { url: WEB_APP } }]],
    },
  })

  res.status(200).json({ ok: true })
}
