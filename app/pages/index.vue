<script setup lang="ts">
type Screen = 'intro' | 'question' | 'clue' | 'letter' | 'arrival' | 'next'
const screen = ref<Screen>('intro')
const attempts = ref(3)
const answer = ref('')
const answerNote = ref('')
const foundInput = ref('')
const foundNote = ref('')
const hotelCode = ref('')
const hotelCodeNote = ref('')
const hotelCodeOpen = ref(false)
const safeCode = ref('')
const safeCodeNote = ref('')
const toast = ref('')
const hintOpen = ref(false)
const rescueOpen = ref(false)
const hasTgMain = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined
const progress = computed(() => ({
  intro: '12%',
  question: '28%',
  clue: '46%',
  letter: '64%',
  arrival: '82%',
  next: '100%',
}[screen.value]))
const attemptsLabel = computed(() => `${attempts.value} ${attempts.value === 1 ? 'попытка' : attempts.value < 5 ? 'попытки' : 'попыток'}`)
function storageGet(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}
function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}
function telegramApp() {
  return (window as Window & { Telegram?: { WebApp?: {
    MainButton: {
      setText: (text: string) => void
      setParams?: (params: Record<string, string | boolean>) => void
      show: () => void
      hide: () => void
      onClick: (callback: () => void) => void
      offClick: (callback: () => void) => void
    }
  } } }).Telegram?.WebApp
}
function setScreen(next: Screen) {
  screen.value = next
  storageSet('questScreen', next)
  requestAnimationFrame(() => {
    document.querySelector('.screen')?.scrollTo({ top: 0 })
  })
}
function showToast(message: string) { toast.value = message; if (toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 2600) }
function choose(choice: 'yes' | 'no' | 'info') { if (choice === 'yes') return setScreen('question'); showToast(choice === 'no' ? 'Я всё равно буду ждать, когда передумаешь ✦' : 'Это маленькое путешествие по подсказкам. Начнём?') }
function checkAnswer() {
  const normalized = answer.value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^а-я]/g, '')
  if (!normalized) { answerNote.value = 'Напиши свой вариант — я жду.'; return }
  if (normalized === 'сочи') { answerNote.value = 'Да! Ты нашла первую точку.'; storageSet('questSolved', 'true'); window.setTimeout(() => setScreen('clue'), 550); return }
  if (attempts.value > 0) attempts.value--
  storageSet('questAttempts', String(attempts.value)); answer.value = ''
  answerNote.value = attempts.value ? `Почти. Попробуй ещё — осталось: ${attempts.value}.` : 'Похоже, сегодня загадки особенно хитрые.'
  if (attempts.value === 0) window.setTimeout(() => rescueOpen.value = true, 350)
}
function addAttempts() { attempts.value = 100; storageSet('questAttempts', '100'); answerNote.value = 'Вот так лучше. Дыши — и пробуй снова.'; rescueOpen.value = false }
async function submitFound() {
  if (!foundInput.value.trim()) { foundNote.value = 'Введи код, который обведён на билете.'; return }
  if (foundInput.value.trim() !== '12345') { foundNote.value = 'Не похоже. Проверь цифры на билете ещё раз.'; return }
  storageSet('questMailboxFound', foundInput.value.trim())
  storageSet('questTicketsUnlocked', 'true')
  foundNote.value = 'Верно. Открываю твоё письмо…'
  window.setTimeout(() => setScreen('letter'), 600)
}
function checkHotelCode() { if (hotelCode.value.trim().toLocaleLowerCase('ru-RU') !== 'слово') { hotelCodeNote.value = 'Проверь кодовое слово ещё раз.'; return }; hotelCodeOpen.value = false; setScreen('next') }
function checkSafeCode() { if (safeCode.value.trim() !== '51234') { safeCodeNote.value = 'Почти. Вернись к числам, которые уже встретились тебе в квесте.'; return }; safeCodeNote.value = 'Верно. Сейф открыт — следующая подсказка уже внутри. ✦' }
const SCREEN_ORDER: Screen[] = ['intro', 'question', 'clue', 'letter', 'arrival', 'next']
const photoBase = useRuntimeConfig().app.baseURL
const photo = (name: string) => `${photoBase}us/${name}`.replace(/([^:])\/{2,}/g, '$1/')
const photoSet = computed(() => ({
  intro: [photo('carousel.jpg'), photo('look.jpg')],
  question: [photo('mountains.jpg'), photo('tea.jpg')],
  clue: [photo('cafe.jpg'), photo('kiss.jpg')],
  letter: [photo('ruzhik.jpg'), photo('look.jpg')],
  arrival: [photo('fountain.jpg'), photo('carousel.jpg')],
  next: [photo('kiss.jpg'), photo('cafe.jpg')],
}[screen.value]))
function goBack() {
  if (hotelCodeOpen.value) { hotelCodeOpen.value = false; return }
  if (hintOpen.value) { hintOpen.value = false; return }
  if (rescueOpen.value) { rescueOpen.value = false; return }
  const index = SCREEN_ORDER.indexOf(screen.value)
  if (index > 0) setScreen(SCREEN_ORDER[index - 1])
}
function scrollField(event: Event) { const el = event.target as HTMLElement; window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 280) }
function startQuest() { choose('yes') }
onMounted(() => {
  attempts.value = Number(storageGet('questAttempts') || 3)
  const saved = storageGet('questScreen') as Screen | null
  if (storageGet('questTicketsUnlocked') === 'true' && ['letter', 'arrival', 'next'].includes(saved || '')) screen.value = saved!
  else if (storageGet('questTicketsUnlocked') === 'true') screen.value = 'letter'
  else if (storageGet('questSolved') === 'true') screen.value = 'clue'
  else if (saved === 'question') screen.value = 'question'
  foundInput.value = storageGet('questMailboxFound') || ''
  const main = telegramApp()?.MainButton
  hasTgMain.value = Boolean(main)
  if (!main) return
  watch(screen, (value) => {
    main.offClick(startQuest)
    if (value === 'intro') {
      main.setText('Да, готова')
      main.setParams?.({ color: '#e27aa3', text_color: '#fff7fb', is_active: true, is_visible: true })
      main.show()
      main.onClick(startQuest)
    } else {
      main.hide()
    }
  }, { immediate: true })
})
</script>

<template>
  <main class="app-shell" :class="[`stage-${screen}`, { 'has-tg-main': hasTgMain && screen === 'intro' }]">
    <header class="topbar">
      <button v-if="screen !== 'intro'" type="button" class="back-button" aria-label="Назад" @click="goBack">назад</button>
      <span v-else class="back-spacer" />
      <div class="progress-wrap">
        <span class="brand">найди меня</span>
        <div class="progress"><i :style="{ width: progress }" /></div>
      </div>
      <span class="back-spacer" />
    </header>

    <div class="photos">
      <figure class="polaroid tilt-a">
        <img :src="photoSet[0]" alt="">
      </figure>
      <figure class="polaroid tilt-b">
        <img :src="photoSet[1]" alt="">
      </figure>
    </div>

    <section v-if="screen === 'intro'" class="screen">
      <p class="kicker">личный квест</p>
      <h1 class="title">Найди меня.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="lead">Я уехал. Но оставил для тебя маршрут — если, конечно, ты готова пойти по следу.</p>
        <div class="choices">
          <button type="button" class="btn-ghost btn" @click="choose('no')">Нет, не хочу тебя искать</button>
          <button type="button" class="btn-ghost btn" @click="choose('info')">Я ничего не поняла</button>
        </div>
      </article>
      <div class="btn-row">
        <button type="button" class="btn" @click="startQuest">Да, готова</button>
      </div>
    </section>

    <section v-else-if="screen === 'question'" class="screen">
      <p class="kicker">этап 01 · точка на карте</p>
      <h1 class="title">Где я?</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <p class="attempts">{{ attemptsLabel }}</p>
      <article class="card">
        <p>Чтобы искать было проще, нужно понять, где искать. Напиши свой вариант.</p>
        <label class="field">
          <input v-model="answer" type="text" placeholder="Угадай, где я..." autocomplete="off" @focus="scrollField" @keyup.enter="checkAnswer">
          <button type="button" aria-label="Проверить ответ" @click="checkAnswer">→</button>
        </label>
        <p class="note" role="status">{{ answerNote }}</p>
      </article>
    </section>

    <section v-else-if="screen === 'clue'" class="screen">
      <p class="kicker">этап 01 пройден</p>
      <h1 class="title">Ты на верном пути.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="meta">следующая координата</p>
        <p class="cipher">V · I · I</p>
        <p class="cipher-sub">пятьсот + одиннадцать</p>
        <p>Там, где письма ждут своих историй, ищи дверцу с этим номером. Она знает, куда идти дальше.</p>
        <label class="field">
          <input id="foundInput" v-model="foundInput" type="text" inputmode="numeric" placeholder="Код с билетов" autocomplete="off" @focus="scrollField" @keyup.enter="submitFound">
          <button type="button" aria-label="Отправить" @click="submitFound">→</button>
        </label>
        <p class="note" role="status">{{ foundNote }}</p>
      </article>
      <div class="btn-row">
        <button type="button" class="btn-ghost btn" @click="hintOpen = true">Подсказка</button>
      </div>
    </section>

    <section v-else-if="screen === 'letter'" class="screen">
      <p class="kicker">письмо № 02</p>
      <h1 class="title">Маршрут начинается.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="card-title">Привет, мышка!</p>
        <p>Если ты это читаешь, значит, ты уже знаешь, куда тебе предстоит ехать. Хочу сказать: много одежды не бери, ведь в Сочи ты едешь, к сожалению, ненадолго. Но уверяю тебя — эмоции будут невероятные.</p>
        <p>Ружик в надёжных руках, можешь о нём не беспокоиться. Времени на сборы не так много: бери всё самое необходимое, красивое нижнее бельё и пару красивых образов.</p>
        <p>Едь, а всю дальнейшую информацию ты получишь по приезде.</p>
        <p class="sign">Твой маршрут</p>
      </article>
      <div class="btn-row">
        <button type="button" class="btn" @click="setScreen('arrival')">Я доехала</button>
      </div>
    </section>

    <section v-else-if="screen === 'arrival'" class="screen">
      <p class="kicker">добро пожаловать в сочи</p>
      <h1 class="title">Твоя новая точка.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="meta">отель</p>
        <p class="hotel-name">8Авеню by Provence</p>
        <p class="hotel-address">Сочи, улица Орджоникидзе, 8а</p>
        <p>Приезжай, располагайся — там тебя ждёт следующая подсказка.</p>
      </article>
      <div class="btn-row">
        <a class="btn-ghost btn" href="https://otello.ru/hotel/70000001075315139?checkin=2026-08-28&amp;checkout=2026-08-30&amp;guest_groups=%5B%7B%22adults%22%3A2%7D%5D" target="_blank" rel="noopener">Открыть отель</a>
        <button type="button" class="btn" @click="hotelCodeOpen = true">Я в отеле</button>
      </div>
    </section>

    <section v-else class="screen">
      <p class="kicker">секретная точка</p>
      <h1 class="title">Тише. Сейф рядом.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p>Ищи маленькую стальную дверцу там, где вещи остаются в безопасности до утра. Она умеет хранить не только ценности, но и подсказки.</p>
        <p class="meta">кодовая головоломка</p>
        <p>Вспомни номер дверцы с письмами и цифры, которые были обведены на билетах.</p>
        <ol class="list">
          <li>Напиши оба числа подряд.</li>
          <li>Убери все повторяющиеся цифры, но первую встречу каждой оставь.</li>
          <li>Не меняй порядок.</li>
        </ol>
        <label class="field">
          <input v-model="safeCode" type="text" inputmode="numeric" maxlength="5" placeholder="Код сейфа" autocomplete="one-time-code" @focus="scrollField" @keyup.enter="checkSafeCode">
          <button type="button" aria-label="Открыть сейф" @click="checkSafeCode">→</button>
        </label>
        <p class="note" role="status">{{ safeCodeNote }}</p>
      </article>
    </section>

    <div class="modal" :class="{ show: hintOpen }" :aria-hidden="!hintOpen">
      <div class="modal-backdrop" @click="hintOpen = false" />
      <article class="card modal-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="hintOpen = false">×</button>
        <p class="kicker">подсказка</p>
        <p class="card-title">Ищи эту дверцу</p>
        <img src="/assets/mailbox-511.png" alt="Почтовый ящик с номером 511">
        <p>Номер должен быть совсем рядом. Ты справишься.</p>
      </article>
    </div>

    <div class="modal" :class="{ show: rescueOpen }" :aria-hidden="!rescueOpen">
      <div class="modal-backdrop" />
      <article class="card modal-card">
        <p class="kicker">секретный запас</p>
        <p class="card-title">Ну ладно, не нервничай.</p>
        <p>Вот тебе ещё <strong>100 попыток</strong>. На этот раз точно получится.</p>
        <div class="btn-row">
          <button type="button" class="btn" @click="addAttempts">Забрать попытки</button>
        </div>
      </article>
    </div>

    <div class="modal" :class="{ show: hotelCodeOpen }" :aria-hidden="!hotelCodeOpen">
      <div class="modal-backdrop" @click="hotelCodeOpen = false" />
      <article class="card modal-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="hotelCodeOpen = false">×</button>
        <p class="kicker">в отеле</p>
        <p class="card-title">Введи кодовое слово.</p>
        <p>Оно приведёт тебя к следующей подсказке.</p>
        <label class="field">
          <input v-model="hotelCode" type="text" placeholder="Кодовое слово" autocomplete="off" @focus="scrollField" @keyup.enter="checkHotelCode">
          <button type="button" aria-label="Проверить код" @click="checkHotelCode">→</button>
        </label>
        <p class="note" role="status">{{ hotelCodeNote }}</p>
      </article>
    </div>

    <div class="toast" :class="{ show: toast }">{{ toast }}</div>
  </main>
</template>
