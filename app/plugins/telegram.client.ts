export default defineNuxtPlugin(() => {
  const telegram = (window as Window & {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        setHeaderColor?: (color: string) => void
        setBackgroundColor?: (color: string) => void
        viewportStableHeight?: number
        viewportHeight?: number
        onEvent?: (event: string, callback: () => void) => void
      }
    }
  }).Telegram?.WebApp

  const applyViewport = () => {
    const height = telegram?.viewportStableHeight || telegram?.viewportHeight
    if (height) document.documentElement.style.setProperty('--tg-viewport-stable-height', `${height}px`)
  }

  telegram?.ready()
  telegram?.expand()
  telegram?.setHeaderColor?.('#f2e6dc')
  telegram?.setBackgroundColor?.('#f2e6dc')
  telegram?.onEvent?.('viewportChanged', applyViewport)
  applyViewport()
})
