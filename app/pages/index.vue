<script setup lang="ts">
type Screen = 'intro' | 'question' | 'clue' | 'letter' | 'arrival' | 'next' | 'finale'
const screen = ref<Screen>('intro')
const attempts = ref(3)
const answer = ref('')
const answerNote = ref('')
const foundInput = ref('')
const foundNote = ref('')
const hotelCode = ref('')
const hotelCodeNote = ref('')
const hotelCodeOpen = ref(false)
const elephantHintOpen = ref(false)
const safeCode = ref('')
const safeCodeNote = ref('')
const toast = ref('')
const hintOpen = ref(false)
const rescueOpen = ref(false)
const HOTEL_UNLOCK_AT = Date.parse('2026-08-29T01:00:00+03:00')
const SAFE_UNLOCK_AT = Date.parse('2026-08-29T09:00:00+03:00')
const nowMs = ref(Date.now())
const hotelUnlocked = computed(() => nowMs.value >= HOTEL_UNLOCK_AT)
const safeUnlocked = computed(() => nowMs.value >= SAFE_UNLOCK_AT)
function makeCountdown(target: number) {
  const sec = Math.max(0, Math.floor((target - nowMs.value) / 1000))
  return {
    days: String(Math.floor(sec / 86400)).padStart(2, '0'),
    hours: String(Math.floor((sec % 86400) / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((sec % 3600) / 60)).padStart(2, '0'),
    seconds: String(sec % 60).padStart(2, '0'),
  }
}
const hotelCountdown = computed(() => makeCountdown(HOTEL_UNLOCK_AT))
const countdown = computed(() => makeCountdown(SAFE_UNLOCK_AT))
let toastTimer: ReturnType<typeof setTimeout> | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
const progress = computed(() => ({
  intro: '12%',
  question: '28%',
  clue: '46%',
  letter: '64%',
  arrival: '82%',
  next: '90%',
  finale: '100%',
}[screen.value]))
const attemptsLabel = computed(() => `${attempts.value} ${attempts.value === 1 ? 'попытка' : attempts.value < 5 ? 'попытки' : 'попыток'}`)
function storageGet(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}
function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
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
  if (foundInput.value.trim() !== '88346') { foundNote.value = 'Не похоже. Проверь цифры на билете ещё раз.'; return }
  storageSet('questMailboxFound', foundInput.value.trim())
  storageSet('questTicketsUnlocked', 'true')
  foundNote.value = 'Верно. Открываю твоё письмо…'
  window.setTimeout(() => setScreen('letter'), 600)
}
function checkHotelCode() {
  const normalized = hotelCode.value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^а-я]/g, '')
  if (!normalized) { hotelCodeNote.value = 'Напиши ответ — я жду.'; return }
  if (!normalized.includes('слон')) { hotelCodeNote.value = 'Не то. Вспомни, к кому мы ездили в тот день.'; return }
  closeHotelGate()
  storageSet('questHotelUnlocked', 'true')
  setScreen('next')
}
function tickClock() { nowMs.value = Date.now() }
function syncSafeClock() {
  tickClock()
  const waiting =
    (screen.value === 'arrival' && nowMs.value < HOTEL_UNLOCK_AT) ||
    (screen.value === 'next' && nowMs.value < SAFE_UNLOCK_AT)
  if (waiting && !clockTimer) clockTimer = setInterval(tickClock, 250)
  if (!waiting && clockTimer) {
    clearInterval(clockTimer)
    clockTimer = undefined
  }
}
function onClockVisible() {
  if (document.visibilityState === 'visible') syncSafeClock()
}
function checkSafeCode() {
  const digits = safeCode.value.replace(/\D/g, '')
  if (!digits) { safeCodeNote.value = 'Напиши код — я жду.'; return }
  if (digits !== '010623' && digits !== '01062023') {
    safeCodeNote.value = 'Не то. Вспомни день, когда всё началось.'
    return
  }
  storageSet('questSafeOpened', 'true')
  safeCodeNote.value = 'Верно. Открой сейф этим кодом — следующая подсказка уже внутри. ✦'
  window.setTimeout(() => setScreen('finale'), 900)
}
const SCREEN_ORDER: Screen[] = ['intro', 'question', 'clue', 'letter', 'arrival', 'next', 'finale']
type PolaroidShot = {
  src: string
  focal: string
  style: Record<string, string>
}
const PHOTO_POOL: Record<Screen, string[]> = {
  intro: ['carousel.jpg', 'look.jpg', 'kiss.jpg'],
  question: ['mountains.jpg', 'tea.jpg', 'look.jpg'],
  clue: ['cafe.jpg', 'kiss.jpg', 'fountain.jpg'],
  letter: ['ruzhik.jpg', 'look.jpg', 'tea.jpg'],
  arrival: ['fountain.jpg', 'carousel.jpg', 'cafe.jpg'],
  next: ['kiss.jpg', 'cafe.jpg', 'mountains.jpg'],
  finale: ['look.jpg', 'kiss.jpg', 'carousel.jpg'],
}
const photoBase = useRuntimeConfig().app.baseURL
const photo = (name: string) => `${photoBase}us/${name}`.replace(/([^:])\/{2,}/g, '$1/')
function seededRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let a = h >>> 0
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0
    return a / 4294967296
  }
}
function shuffleInPlace<T>(items: T[], rand: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]]
  }
  return items
}
function makeShot(src: string, rotate: number, left: number, top: number, width: number, z: number, rand: () => number): PolaroidShot {
  const focals = ['center 18%', 'center 28%', 'center 38%', '52% 22%', '46% 32%']
  return {
    src: photo(src),
    focal: focals[Math.floor(rand() * focals.length)],
    style: {
      '--r': `${rotate.toFixed(1)}deg`,
      '--x': `${left.toFixed(1)}%`,
      '--y': `${top.toFixed(1)}px`,
      '--w': `${width.toFixed(1)}%`,
      '--z': String(z),
    },
  }
}
const PHOTO_LAYOUTS: Record<Screen, { count: 1 | 2; order: 0 | 4; place: 'left' | 'right' | 'center' | 'stagger-a' | 'stagger-b' }> = {
  intro: { count: 2, order: 0, place: 'stagger-a' },
  question: { count: 1, order: 0, place: 'center' },
  clue: { count: 2, order: 4, place: 'stagger-b' },
  letter: { count: 1, order: 4, place: 'center' },
  arrival: { count: 2, order: 0, place: 'stagger-b' },
  next: { count: 2, order: 4, place: 'stagger-a' },
  finale: { count: 2, order: 0, place: 'stagger-b' },
}
const photoLayout = computed(() => {
  const rand = seededRandom(`polaroid:${screen.value}`)
  const pool = shuffleInPlace([...PHOTO_POOL[screen.value]], rand)
  const { count, order, place } = PHOTO_LAYOUTS[screen.value]
  const files = pool.slice(0, count)
  const jitter = (n: number) => (rand() - 0.5) * n
  if (count === 1) {
    const dir = place === 'left' ? -1 : 1
    const rotate = dir * (3.2 + rand() * 2.4)
    const shots = place === 'left'
      ? [makeShot(files[0]!, rotate, 10 + jitter(6), 8 + jitter(4), 58 + jitter(3), 2, rand)]
      : place === 'right'
        ? [makeShot(files[0]!, rotate, 28 + jitter(6), 8 + jitter(4), 58 + jitter(3), 2, rand)]
        : [makeShot(files[0]!, rotate, 20 + jitter(6), 6 + jitter(4), 60 + jitter(2), 2, rand)]
    return { shots, order }
  }
  const leftHigh = place === 'stagger-a'
  return {
    order,
    shots: [
      makeShot(files[0]!, -5.5 + jitter(3), 2 + jitter(6), leftHigh ? 4 + jitter(4) : 16 + jitter(6), 42 + jitter(4), leftHigh ? 3 : 1, rand),
      makeShot(files[1]!, 4.8 + jitter(3), 40 + jitter(6), leftHigh ? 16 + jitter(6) : 4 + jitter(4), 40 + jitter(4), leftHigh ? 1 : 3, rand),
    ],
  }
})
function openHotelGate() {
  hotelCodeOpen.value = true
}
function closeHotelGate() {
  elephantHintOpen.value = false
  hotelCodeOpen.value = false
}
function goBack() {
  if (elephantHintOpen.value) { elephantHintOpen.value = false; return }
  if (hotelCodeOpen.value) { closeHotelGate(); return }
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
  if (storageGet('questTicketsUnlocked') === 'true' && ['letter', 'arrival', 'next', 'finale'].includes(saved || '')) screen.value = saved!
  else if (storageGet('questTicketsUnlocked') === 'true') screen.value = 'letter'
  else if (storageGet('questSolved') === 'true') screen.value = 'clue'
  else if (saved === 'question') screen.value = 'question'
  foundInput.value = storageGet('questMailboxFound') || ''
  if (storageGet('questSafeOpened') === 'true') safeCodeNote.value = 'Верно. Открой сейф этим кодом — следующая подсказка уже внутри. ✦'
  if (storageGet('questHotelUnlocked') === 'true' && (saved === 'next' || saved === 'finale')) screen.value = saved!
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    const preview = new URLSearchParams(location.search).get('screen') as Screen | null
    if (preview && SCREEN_ORDER.includes(preview)) screen.value = preview
  }
  document.addEventListener('visibilitychange', onClockVisible)
  watch([screen, hotelUnlocked, safeUnlocked], syncSafeClock, { immediate: true })
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onClockVisible)
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = undefined
  }
})
</script>

<template>
  <main class="app-shell" :class="`stage-${screen}`">
    <header class="topbar">
      <button v-if="screen !== 'intro'" type="button" class="back-button" aria-label="Назад" @click="goBack">назад</button>
      <span v-else class="back-spacer" />
      <div class="progress-wrap">
        <span class="brand">найди меня</span>
        <div class="progress"><i :style="{ width: progress }" /></div>
      </div>
      <span class="back-spacer" />
    </header>

    <section
      class="screen"
      :key="screen"
      :class="{ 'photos-mid': photoLayout.order === 4, 'photos-solo': photoLayout.shots.length === 1 }"
      :style="{ '--photo-order': photoLayout.order }"
    >
      <div class="photos" :class="{ 'is-solo': photoLayout.shots.length === 1 }" aria-hidden="true">
        <figure
          v-for="(item, i) in photoLayout.shots"
          :key="`${screen}-${i}`"
          class="polaroid"
          :style="item.style"
        >
          <img :src="item.src" alt="" :style="{ objectPosition: item.focal }">
        </figure>
      </div>

      <template v-if="screen === 'intro'">
      <p class="kicker">личный квест</p>
      <h1 class="title">Найди меня.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="lead">Я уехал. Но оставил для тебя маршрут — если, конечно, ты готова пойти по следу.</p>
        <button type="button" class="btn" @click="startQuest">Да, готова</button>
        <div class="choices">
          <button type="button" class="btn-ghost btn" @click="choose('no')">Нет, не хочу тебя искать</button>
          <button type="button" class="btn-ghost btn" @click="choose('info')">Я ничего не поняла</button>
        </div>
      </article>
      </template>

      <template v-else-if="screen === 'question'">
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
      </template>

      <template v-else-if="screen === 'clue'">
      <p class="kicker">этап 01 пройден</p>
      <h1 class="title">Ты на верном пути.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="meta">следующая координата</p>
        <p class="cipher">511</p>
        <p class="cipher-sub">первый этаж</p>
        <p>Спустись на первый этаж. Среди почтовых ящиков найди номер 511 — там тебя ждёт подсказка.</p>
        <label class="field">
          <input id="foundInput" v-model="foundInput" type="text" inputmode="numeric" placeholder="Код с билетов" autocomplete="off" @focus="scrollField" @keyup.enter="submitFound">
          <button type="button" aria-label="Отправить" @click="submitFound">→</button>
        </label>
        <p class="note" role="status">{{ foundNote }}</p>
        <button type="button" class="btn-ghost btn" @click="hintOpen = true">Подсказка</button>
      </article>
      </template>

      <template v-else-if="screen === 'letter'">
      <p class="kicker">письмо № 02</p>
      <h1 class="title">Маршрут начинается.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="card-title">Привет, мышка!</p>
        <p>Если ты это читаешь, значит, ты уже знаешь, куда тебе предстоит ехать. Хочу предупредить, много одежды не бери, ведь в Сочи ты едешь, к сожалению, ненадолго. Но уверяю тебя — эмоции будут невероятные.</p>
        <p>К сожалению, Ружика я не смог увезти, поэтому тебе нужно самой отвезти его на передержку. Времени на сборы не так много: бери всё самое необходимое, красивое нижнее бельё и пару красивых образов.</p>
        <p>Езжай, а всю дальнейшую информацию ты получишь по приезде.</p>
        <p class="sign">Твой маршрут</p>
        <button type="button" class="btn" @click="setScreen('arrival')">Я доехала</button>
      </article>
      </template>

      <template v-else-if="screen === 'arrival'">
      <template v-if="!hotelUnlocked">
      <p class="kicker">ещё не время</p>
      <h1 class="title">Ночью в час.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p>Эта подсказка откроется сама, ровно в <strong>01:00 по Москве 29 августа</strong>.</p>
        <div class="countdown" aria-live="polite">
          <div class="countdown-cell">
            <span class="countdown-value">{{ hotelCountdown.days }}</span>
            <span class="countdown-label">дн</span>
          </div>
          <div class="countdown-cell">
            <span class="countdown-value">{{ hotelCountdown.hours }}</span>
            <span class="countdown-label">ч</span>
          </div>
          <div class="countdown-cell">
            <span class="countdown-value">{{ hotelCountdown.minutes }}</span>
            <span class="countdown-label">мин</span>
          </div>
          <div class="countdown-cell">
            <span class="countdown-value">{{ hotelCountdown.seconds }}</span>
            <span class="countdown-label">сек</span>
          </div>
        </div>
        <p>Пока доедь. В нужный момент страница откроется сама — ничего нажимать не нужно.</p>
      </article>
      </template>
      <template v-else>
      <p class="kicker">добро пожаловать в сочи</p>
      <h1 class="title">Твоя новая точка.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p class="meta">отель</p>
        <p class="hotel-name">8Авеню by Provence</p>
        <p class="hotel-address">Сочи, улица Орджоникидзе, 8а</p>
        <p>Приезжай, располагайся — там тебя ждёт следующая подсказка.</p>
        <a class="btn-ghost btn" href="https://otello.ru/hotel/70000001075315139?checkin=2026-08-28&amp;checkout=2026-08-30&amp;guest_groups=%5B%7B%22adults%22%3A2%7D%5D" target="_blank" rel="noopener">Открыть отель</a>
        <button type="button" class="btn" @click="openHotelGate">Я в отеле</button>
      </article>
      </template>
      </template>

      <template v-else-if="screen === 'next'">
      <template v-if="!safeUnlocked">
      <p class="kicker">ещё не время</p>
      <h1 class="title">Утром в девять.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p>Эта подсказка откроется сама, ровно в <strong>09:00 по Москве 29 августа</strong>.</p>
        <div class="countdown" aria-live="polite">
          <div class="countdown-cell">
            <span class="countdown-value">{{ countdown.days }}</span>
            <span class="countdown-label">дн</span>
          </div>
          <div class="countdown-cell">
            <span class="countdown-value">{{ countdown.hours }}</span>
            <span class="countdown-label">ч</span>
          </div>
          <div class="countdown-cell">
            <span class="countdown-value">{{ countdown.minutes }}</span>
            <span class="countdown-label">мин</span>
          </div>
          <div class="countdown-cell">
            <span class="countdown-value">{{ countdown.seconds }}</span>
            <span class="countdown-label">сек</span>
          </div>
        </div>
        <p>Пока расположись в номере. В нужный момент страница откроется сама — ничего нажимать не нужно.</p>
      </article>
      </template>
      <template v-else>
      <p class="kicker">в номере</p>
      <h1 class="title">Сейф рядом.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <p>В комнате есть сейф. Найди его — следующая подсказка уже внутри.</p>
        <p class="meta">код</p>
        <p class="card-title">Код — день, когда всё началось.</p>
        <label class="field">
          <input v-model="safeCode" type="text" inputmode="numeric" maxlength="10" placeholder="Код сейфа" autocomplete="one-time-code" @focus="scrollField" @keyup.enter="checkSafeCode">
          <button type="button" aria-label="Проверить код" @click="checkSafeCode">→</button>
        </label>
        <p class="note" role="status">{{ safeCodeNote }}</p>
      </article>
      </template>
      </template>

      <template v-else>
      <p class="kicker">вечер</p>
      <h1 class="title">До встречи.</h1>
      <div class="ornament" aria-hidden="true">✦</div>
      <article class="card">
        <img class="story-photo" :src="photo('pier.png')" alt="Пирс возле ресторана Sanremo">
        <p>Хоть я и уверен, что ты прекрасно помнишь тот момент с запуском фонарика, я не очень уверен в твоих поисковых способностях. Тот пирс был возле ресторана Sanremo, на фото указатель!</p>
        <p>Сегодня у тебя день «для себя»: погуляй по любимому Сочи, насладись пальмами, атмосферой и напитайся хорошей энергией. Я с нетерпением жду нашей встречи в 23:00. Очень тебя люблю и скучаю, твой Кош.</p>
        <p class="sign">P.s. у нас ещё будет денёк погулять по Сочи вместе.</p>
      </article>
      </template>
    </section>

    <div class="modal" :class="{ show: hintOpen }" :aria-hidden="!hintOpen">
      <div class="modal-backdrop" @click="hintOpen = false" />
      <article class="card modal-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="hintOpen = false">×</button>
        <p class="kicker">подсказка</p>
        <p class="card-title">Убери повторяющиеся цифры.</p>
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

    <div class="modal hotel-gate" :class="{ show: hotelCodeOpen }" :aria-hidden="!hotelCodeOpen">
      <div class="modal-backdrop is-blur" @click="closeHotelGate" />
      <article class="card modal-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="closeHotelGate">×</button>
        <p class="kicker">в отеле</p>
        <p>Мне нужно убедиться, что это действительно так.</p>
        <p class="card-title">К кому мы ездили, когда сделали фото, которое ты нашла в конверте?</p>
        <label class="field">
          <input v-model="hotelCode" type="text" placeholder="Ответ" autocomplete="off" @focus="scrollField" @keyup.enter="checkHotelCode">
          <button type="button" aria-label="Проверить код" @click="checkHotelCode">→</button>
        </label>
        <p class="note" role="status">{{ hotelCodeNote }}</p>
        <button type="button" class="btn-ghost btn" @click="elephantHintOpen = true">Подсказка</button>
      </article>
    </div>

    <div class="modal hotel-hint" :class="{ show: elephantHintOpen }" :aria-hidden="!elephantHintOpen">
      <div class="modal-backdrop is-blur" @click="elephantHintOpen = false" />
      <article class="card modal-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="elephantHintOpen = false">×</button>
        <p class="kicker">подсказка</p>
        <img src="/assets/elephant-hint.jpg" alt="Подсказка">
      </article>
    </div>

    <div class="toast" :class="{ show: toast }">{{ toast }}</div>
  </main>
</template>
