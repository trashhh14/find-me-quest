/**
 * Local development fallback for Telegram.
 * It intentionally uses long polling, so /start keeps working when a temporary
 * webhook tunnel is unavailable. Run with NUXT_BOT_TOKEN set.
 */
const token = process.env.NUXT_BOT_TOKEN
const webAppUrl = process.env.NUXT_WEB_APP_URL

if (!token) {
  throw new Error('NUXT_BOT_TOKEN is required to run the Telegram bot.')
}

const api = (method, body) => fetch(`https://api.telegram.org/bot${token}/${method}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
}).then(async (response) => {
  const result = await response.json()
  if (!result.ok) throw new Error(result.description || `Telegram API: ${response.status}`)
  return result.result
})

await api('deleteWebhook', { drop_pending_updates: false })
console.log('Telegram long polling is running. Press Ctrl+C to stop.')

let offset = 0
for (;;) {
  try {
    const updates = await api('getUpdates', { offset, timeout: 45, allowed_updates: ['message'] })
    for (const update of updates) {
      offset = update.update_id + 1
      const message = update.message
      if (message?.text !== '/start') continue

      const replyMarkup = webAppUrl
        ? { inline_keyboard: [[{ text: 'Открыть квест ✦', web_app: { url: webAppUrl } }]] }
        : undefined

      await api('sendMessage', {
        chat_id: message.chat.id,
        text: 'Я уехал и оставил для тебя маршрут. Готова меня найти?',
        reply_markup: replyMarkup,
      })
    }
  } catch (error) {
    console.error('Telegram polling error:', error.message)
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
}
