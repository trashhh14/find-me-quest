const WEB_APP_BASE = (process.env.NUXT_WEB_APP_URL || 'https://trashhh14.github.io/find-me-quest/').replace(/\/?$/, '/')
const WEB_APP = `${WEB_APP_BASE}?v=202608274`
const TOKEN = process.env.NUXT_BOT_TOKEN
const PHOTO_URL = `${WEB_APP_BASE}us/kiss.jpg`
const CAPTION = 'Я уехал и оставил для тебя маршрут. Готова меня найти?'

function isStart(text) {
  return typeof text === 'string' && /^\/start(?:@\w+)?(?:\s|$)/.test(text.trim())
}

function markup() {
  return {
    inline_keyboard: [[{ text: 'Открыть квест ✦', web_app: { url: WEB_APP } }]],
  }
}

async function telegram(method, body, isForm = false) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: isForm ? undefined : { 'content-type': 'application/json' },
    body: isForm ? body : JSON.stringify(body),
  })
  return response.json()
}

async function sendStartPhoto(chatId, host) {
  const origins = [
    host ? `https://${host}/us/kiss.jpg` : null,
    PHOTO_URL,
    `${WEB_APP_BASE}assets/quest-invite.jpg`,
  ].filter(Boolean)

  for (const url of origins) {
    const result = await telegram('sendPhoto', {
      chat_id: chatId,
      photo: url,
      caption: CAPTION,
      reply_markup: markup(),
    })
    if (result.ok) return result
  }

  const photoRes = await fetch(PHOTO_URL)
  if (photoRes.ok) {
    const bytes = Buffer.from(await photoRes.arrayBuffer())
    const form = new FormData()
    form.set('chat_id', String(chatId))
    form.set('caption', CAPTION)
    form.set('reply_markup', JSON.stringify(markup()))
    form.set('photo', new Blob([bytes], { type: 'image/jpeg' }), 'kiss.jpg')
    const uploaded = await telegram('sendPhoto', form, true)
    if (uploaded.ok) return uploaded
  }

  return telegram('sendMessage', {
    chat_id: chatId,
    text: CAPTION,
    reply_markup: markup(),
  })
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

  await telegram('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Квест', web_app: { url: WEB_APP } },
  })
  await sendStartPhoto(message.chat.id, req.headers.host)
  res.status(200).json({ ok: true })
}
