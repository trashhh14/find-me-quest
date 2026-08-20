export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const required = [config.resendApiKey, config.emailFrom, config.questRecipientEmail, config.arrivalAt, config.hotelAddress, config.bookingName]
  if (required.some(value => !value)) return { scheduled: false, reason: 'not-configured' }

  const arrivalDate = new Date(config.arrivalAt)
  if (Number.isNaN(arrivalDate.getTime()) || arrivalDate.getTime() <= Date.now()) return { scheduled: false, reason: 'invalid-arrival-time' }

  const html = `<main style="font-family:Arial,sans-serif;color:#34213f;line-height:1.6"><h1>Ты приехала ✦</h1><p>Добро пожаловать в Сочи. Вот твоя следующая точка:</p><p><strong>Отель:</strong> ${escapeHtml(config.hotelAddress)}</p><p><strong>Бронь оформлена на:</strong> ${escapeHtml(config.bookingName)}</p><p>Сохрани это письмо и отправляйся навстречу приключению.</p></main>`
  const result = await $fetch<{ id?: string }>('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Idempotency-Key': `quest-arrival-${arrivalDate.getTime()}` },
    body: { from: config.emailFrom, to: [config.questRecipientEmail], subject: 'Ты приехала ✦', html, scheduled_at: arrivalDate.toISOString() },
  })
  return { scheduled: Boolean(result.id) }
})

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!)
}
