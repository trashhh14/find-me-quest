interface TelegramUpdate { message?: { text?: string; chat: { id: number } } }
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const update = await readBody<TelegramUpdate>(event)
  const chatId = update.message?.chat.id
  if (update.message?.text !== '/start' || !chatId || !config.botToken) return { ok: true }
  const replyMarkup = config.webAppUrl ? { inline_keyboard: [[{ text: 'Открыть квест ✦', web_app: { url: config.webAppUrl } }]] } : undefined
  await $fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, { method: 'POST', body: { chat_id: chatId, text: 'Я уехал и оставил маршрут. Готова меня найти?', reply_markup: replyMarkup } })
  return { ok: true }
})
