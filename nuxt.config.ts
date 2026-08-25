export default defineNuxtConfig({
  ssr: false,
  nitro: {
    preset: 'github_pages',
    prerender: { routes: ['/', '/start'] },
  },
  vite: { server: { allowedHosts: ['.loca.lt'] } },
  css: ['~/assets/main.css', '~/assets/palette.css'],
  runtimeConfig: {
    botToken: '', webAppUrl: '',
    resendApiKey: '', emailFrom: '', questRecipientEmail: '', arrivalAt: '', hotelAddress: '', bookingName: '',
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Найди меня',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }, { name: 'theme-color', content: '#f4a7c3' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600;1,700&family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Outfit:wght@500;600;700&display=swap' },
      ],
      script: [{ src: 'https://telegram.org/js/telegram-web-app.js' }],
    },
  },
})
