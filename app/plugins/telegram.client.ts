type TelegramWebApp = {
  ready: () => void
  expand: () => void
  disableVerticalSwipes?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  viewportStableHeight?: number
  viewportHeight?: number
  safeAreaInset?: { top?: number; bottom?: number }
  contentSafeAreaInset?: { top?: number; bottom?: number }
  onEvent?: (event: string, callback: () => void) => void
}

export default defineNuxtPlugin(() => {
  const telegram = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp
  if (!telegram) return

  const applyViewport = () => {
    const root = document.documentElement
    const height = telegram.viewportStableHeight || telegram.viewportHeight
    if (height) root.style.setProperty('--tg-viewport-stable-height', `${height}px`)
    const top = (telegram.safeAreaInset?.top || 0) + (telegram.contentSafeAreaInset?.top || 0)
    const bottom = (telegram.safeAreaInset?.bottom || 0) + (telegram.contentSafeAreaInset?.bottom || 0)
    root.style.setProperty('--tg-safe-top', `${top}px`)
    root.style.setProperty('--tg-safe-bottom', `${bottom}px`)
  }

  telegram.ready()
  telegram.expand()
  telegram.disableVerticalSwipes?.()
  telegram.setHeaderColor?.('#f4a7c3')
  telegram.setBackgroundColor?.('#f4a7c3')
  telegram.onEvent?.('viewportChanged', applyViewport)
  telegram.onEvent?.('safeAreaChanged', applyViewport)
  telegram.onEvent?.('contentSafeAreaChanged', applyViewport)
  applyViewport()
})
