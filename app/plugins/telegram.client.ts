export default defineNuxtPlugin(() => {
  const telegram = (window as Window & { Telegram?: { WebApp?: { ready: () => void; expand: () => void } } }).Telegram?.WebApp
  telegram?.ready()
  telegram?.expand()
})
