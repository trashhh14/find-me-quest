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
function storageClear(keys: string[]) {
  try { keys.forEach((key) => localStorage.removeItem(key)) } catch {}
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
function resetQuest() { storageClear(['questScreen', 'questAttempts', 'questSolved', 'questMailboxFound', 'questTicketsUnlocked']); attempts.value = 3; answer.value = ''; answerNote.value = ''; foundInput.value = ''; foundNote.value = ''; hotelCode.value = ''; hotelCodeNote.value = ''; safeCode.value = ''; safeCodeNote.value = ''; setScreen('intro') }
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
      main.setParams?.({ color: '#c45c6e', text_color: '#fff8f4', is_active: true, is_visible: true })
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
    <div class="sky" aria-hidden="true">
      <i class="glow glow-one" />
      <i class="glow glow-two" />
      <i class="grain" />
    </div>

    <header class="topbar">
      <button type="button" class="round-button" aria-label="Начать заново" @click="resetQuest">↺</button>
      <div class="progress-wrap">
        <span>Глава 01</span>
        <div class="progress"><i :style="{ width: progress }" /></div>
      </div>
      <div class="round-button sparkle" aria-hidden="true">✦</div>
    </header>

    <section v-if="screen === 'intro'" class="screen">
      <div class="hero">
        <div class="envelope">
          <span class="stamp">SOCHI · 28.08</span>
          <span class="wax" aria-hidden="true">✦</span>
        </div>
      </div>
      <p class="eyebrow">личный квест</p>
      <h1>Найди<br><em>меня.</em></h1>
      <p class="lead">Я уехал. Но оставил для тебя маршрут — если, конечно, ты готова пойти по следу.</p>
      <div class="choice-list">
        <button type="button" class="choice primary" @click="startQuest"><span>Да, готова</span><b>→</b></button>
        <button type="button" class="choice" @click="choose('no')"><span>Нет, не хочу тебя искать</span><b>→</b></button>
        <button type="button" class="choice" @click="choose('info')"><span>Я ничего не поняла</span><b>→</b></button>
      </div>
    </section>

    <section v-else-if="screen === 'question'" class="screen">
      <div class="question-head">
        <p class="eyebrow">этап 01 · точка на карте</p>
        <span class="attempts"><strong>{{ attempts }}</strong> {{ attemptsLabel.replace(/^\d+\s/, '') }}</span>
      </div>
      <article class="glass-card question-card">
        <div class="map-pin">⌖</div>
        <h2>Где я?</h2>
        <p>Чтобы искать было проще, нужно понять, где искать. Тебе нужно угадать, где я.</p>
        <label class="answer-field">
          <input v-model="answer" type="text" placeholder="Угадай, где я..." autocomplete="off" @focus="scrollField" @keyup.enter="checkAnswer">
          <button type="button" aria-label="Проверить ответ" @click="checkAnswer">→</button>
        </label>
        <p class="answer-note" role="status">{{ answerNote }}</p>
      </article>
      <div class="quest-mark"><span /><span /><span /></div>
    </section>

    <section v-else-if="screen === 'clue'" class="screen">
      <div class="success-burst">✦</div>
      <p class="eyebrow">этап 01 пройден</p>
      <h2 class="success-title">Ты на верном<br><em>пути.</em></h2>
      <article class="glass-card clue-card">
        <p class="clue-label">следующая координата</p>
        <p class="cipher">V · I · I</p>
        <p class="cipher-sub">пятьсот + одиннадцать</p>
        <div class="divider" />
        <p class="clue-text">Там, где письма ждут своих историй, ищи дверцу с этим номером. Она знает, куда идти дальше.</p>
        <button type="button" class="hint-button" @click="hintOpen = true"><span class="hint-icon">▧</span> Подсказка <b>→</b></button>
        <div class="found-input">
          <label for="foundInput">Нашла письма с билетами?</label>
          <div class="answer-field">
            <input id="foundInput" v-model="foundInput" type="text" inputmode="numeric" placeholder="Введи код с билетов" autocomplete="off" @focus="scrollField" @keyup.enter="submitFound">
            <button type="button" aria-label="Отправить" @click="submitFound">→</button>
          </div>
          <p class="found-note" role="status">{{ foundNote }}</p>
        </div>
      </article>
      <p class="soft-foot">Не торопись. Самое интересное — в деталях.</p>
    </section>

    <section v-else-if="screen === 'letter'" class="screen">
      <div class="letter-seal">✉</div>
      <p class="eyebrow">письмо № 02</p>
      <h2 class="success-title">Маршрут<br><em>начинается.</em></h2>
      <article class="glass-card letter-card">
        <p class="letter-greeting">Привет, мышка!</p>
        <p>Если ты это читаешь, значит, ты уже знаешь, куда тебе предстоит ехать. Хочу сказать: много одежды не бери, ведь в Сочи ты едешь, к сожалению, ненадолго. Но уверяю тебя — эмоции будут невероятные.</p>
        <p>Ружик в надёжных руках, можешь о нём не беспокоиться. Времени на сборы не так много: бери всё самое необходимое, красивое нижнее бельё и пару красивых образов.</p>
        <p>Едь, а всю дальнейшую информацию ты получишь по приезде.</p>
        <div class="letter-sign">Твой маршрут ✦</div>
      </article>
      <button type="button" class="arrival-button" @click="setScreen('arrival')">Я доехала <b>→</b></button>
    </section>

    <section v-else-if="screen === 'arrival'" class="screen">
      <div class="hotel-pin">⌖</div>
      <p class="eyebrow">добро пожаловать в сочи</p>
      <h2 class="success-title">Твоя новая<br><em>точка.</em></h2>
      <article class="glass-card hotel-card">
        <p class="hotel-label">отель</p>
        <h3>8Авеню by Provence</h3>
        <p class="hotel-address">Сочи, улица Орджоникидзе, 8а</p>
        <a class="hotel-link" href="https://otello.ru/hotel/70000001075315139?checkin=2026-08-28&amp;checkout=2026-08-30&amp;guest_groups=%5B%7B%22adults%22%3A2%7D%5D" target="_blank" rel="noopener">Открыть отель <b>↗</b></a>
        <div class="divider" />
        <p class="hotel-text">Приезжай, располагайся — там тебя ждёт следующая подсказка.</p>
      </article>
      <button type="button" class="arrival-button" @click="hotelCodeOpen = true">Я в отеле <b>→</b></button>
    </section>

    <section v-else class="screen">
      <div class="safe-mark">⌑</div>
      <p class="eyebrow">секретная точка</p>
      <h2 class="success-title">Тише.<br><em>Сейф рядом.</em></h2>
      <article class="glass-card safe-card">
        <p class="safe-lead">Ищи маленькую стальную дверцу там, где вещи остаются в безопасности до утра. Она умеет хранить не только ценности, но и подсказки.</p>
        <div class="safe-divider" />
        <p class="safe-label">кодовая головоломка</p>
        <p class="safe-riddle">Вспомни номер дверцы с письмами и цифры, которые были обведены на билетах.</p>
        <ol class="safe-steps">
          <li>Напиши оба числа подряд.</li>
          <li>Убери все повторяющиеся цифры, но первую встречу каждой оставь.</li>
          <li>Не меняй порядок.</li>
        </ol>
        <label class="answer-field safe-input">
          <input v-model="safeCode" type="text" inputmode="numeric" maxlength="5" placeholder="Введи код сейфа" autocomplete="one-time-code" @focus="scrollField" @keyup.enter="checkSafeCode">
          <button type="button" aria-label="Открыть сейф" @click="checkSafeCode">→</button>
        </label>
        <p class="found-note" role="status">{{ safeCodeNote }}</p>
      </article>
    </section>

    <div class="modal" :class="{ show: hintOpen }" :aria-hidden="!hintOpen">
      <div class="modal-backdrop" @click="hintOpen = false" />
      <article class="modal-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="hintOpen = false">×</button>
        <p class="eyebrow">подсказка</p>
        <h2>Ищи эту дверцу</h2>
        <img src="/assets/mailbox-511.png" alt="Почтовый ящик с номером 511">
        <p>Номер должен быть совсем рядом. Ты справишься.</p>
      </article>
    </div>

    <div class="modal rescue-modal" :class="{ show: rescueOpen }" :aria-hidden="!rescueOpen">
      <div class="modal-backdrop" />
      <article class="modal-card rescue-card">
        <div class="rescue-icon">✦</div>
        <p class="eyebrow">секретный запас</p>
        <h2>Ну ладно,<br><em>не нервничай.</em></h2>
        <p>Вот тебе ещё <strong>100 попыток</strong>. На этот раз точно получится.</p>
        <button type="button" class="rescue-button" @click="addAttempts">Забрать попытки <b>→</b></button>
      </article>
    </div>

    <div class="modal hotel-code-modal" :class="{ show: hotelCodeOpen }" :aria-hidden="!hotelCodeOpen">
      <div class="modal-backdrop" @click="hotelCodeOpen = false" />
      <article class="modal-card hotel-code-card">
        <button type="button" class="modal-close" aria-label="Закрыть" @click="hotelCodeOpen = false">×</button>
        <div class="rescue-icon">⌘</div>
        <p class="eyebrow">в отеле</p>
        <h2>Введи<br><em>кодовое слово.</em></h2>
        <p>Оно приведёт тебя к следующей подсказке.</p>
        <label class="answer-field">
          <input v-model="hotelCode" type="text" placeholder="Кодовое слово" autocomplete="off" @focus="scrollField" @keyup.enter="checkHotelCode">
          <button type="button" aria-label="Проверить код" @click="checkHotelCode">→</button>
        </label>
        <p class="found-note" role="status">{{ hotelCodeNote }}</p>
      </article>
    </div>

    <div class="toast" :class="{ show: toast }">{{ toast }}</div>
  </main>
</template>
