interface TelegramUpdate { message?: { text?: string; chat: { id: number } } }

function isStartCommand(text?: string) {
  return Boolean(text && /^\/start(?:@\w+)?(?:\s|$)/.test(text.trim()))
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const update = await readBody<TelegramUpdate>(event)
  const chatId = update.message?.chat.id
  const webAppBase = (config.webAppUrl || 'https://trashhh14.github.io/find-me-quest/').replace(/\/?$/, '/')
  const webAppUrl = `${webAppBase}?v=202608263`
  if (!isStartCommand(update.message?.text) || !chatId || !config.botToken) return { ok: true }
  await $fetch(`https://api.telegram.org/bot${config.botToken}/sendPhoto`, {
    method: 'POST',
    body: {
      chat_id: chatId,
      photo: `${webAppBase}assets/quest-invitation.png`,
      caption: 'Я уехал и оставил для тебя маршрут. Готова меня найти?',
      reply_markup: { inline_keyboard: [[{ text: 'Открыть квест ✦', web_app: { url: webAppUrl } }]] },
    },
  })
  return { ok: true }
})
