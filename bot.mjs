/**
 * Local Telegram long polling. GitHub Pages cannot receive webhooks,
 * so /start is handled here. Run with NUXT_BOT_TOKEN set.
 */
import dns from 'node:dns'
import { Agent, setGlobalDispatcher } from 'undici'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'

dns.setDefaultResultOrder('ipv4first')
setGlobalDispatcher(new Agent({ connect: { timeout: 30000 } }))

const token = process.env.NUXT_BOT_TOKEN
const webAppBase = (process.env.NUXT_WEB_APP_URL || 'https://trashhh14.github.io/find-me-quest/').replace(/\/?$/, '/')
const webAppUrl = `${webAppBase}?v=202608274`
const invitationFile = fileURLToPath(new URL('./public/assets/quest-invitation.png', import.meta.url))

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

function isStartCommand(text) {
  return typeof text === 'string' && /^\/start(?:@\w+)?(?:\s|$)/.test(text.trim())
}

const questMarkup = {
  inline_keyboard: [[{ text: 'Открыть квест ✦', web_app: { url: webAppUrl } }]],
}

async function sendQuestInvite(chatId) {
  const bytes = await readFile(invitationFile)
  const form = new FormData()
  form.set('chat_id', String(chatId))
  form.set('caption', 'Я уехал и оставил для тебя маршрут. Готова меня найти?')
  form.set('reply_markup', JSON.stringify(questMarkup))
  form.set('photo', new Blob([bytes], { type: 'image/png' }), basename(invitationFile))

  const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: form,
  })
  const result = await response.json()
  if (!result.ok) throw new Error(result.description || `Telegram API: ${response.status}`)
}

await api('deleteWebhook', { drop_pending_updates: false })
await api('setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'Квест', web_app: { url: webAppUrl } },
})
console.log(`Telegram long polling is running. Mini App: ${webAppUrl}`)

let offset = 0
for (;;) {
  try {
    const updates = await api('getUpdates', { offset, timeout: 45, allowed_updates: ['message'] })
    for (const update of updates) {
      offset = update.update_id + 1
      const message = update.message
      if (!isStartCommand(message?.text)) continue
      await sendQuestInvite(message.chat.id)
      console.log(`Sent quest invitation to chat ${message.chat.id}.`)
    }
  } catch (error) {
    console.error('Telegram polling error:', error.message)
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
}
