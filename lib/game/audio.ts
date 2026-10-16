import { useSyncExternalStore } from 'react'

export type SfxName =
  | 'select'
  | 'poke'
  | 'error'
  | 'build'
  | 'complete'
  | 'grove'
  | 'thunder'
  | 'meteorFall'
  | 'meteorImpact'
  | 'quake'
  | 'tornado'
  | 'blessing'
  | 'death'
  | 'birth'
  | 'ignite'
  | 'ageUp'
  | 'objective'
  | 'challengeStart'
  | 'challengeWon'
  | 'challengeLost'
  | 'start'
  | 'tether'
  | 'assign'
  | 'chop'
  | 'ufoArrive'
  | 'ufoLand'
  | 'zap'
  | 'alienHit'
  | 'alienDie'
  | 'ufoExplode'
  | 'abduct'

export type LoopName = 'sun' | 'rain'

interface AudioSettings {
  music: boolean
  sfx: boolean
}

let settings: AudioSettings = { music: true, sfx: true }
const listeners = new Set<() => void>()

let ctx: AudioContext | null = null
let master: GainNode
let sfxBus: GainNode
let musicBus: GainNode
let reverb: ConvolverNode
let reverbSend: GainNode
let noiseBuffer: AudioBuffer

const MUSIC_LEVEL = 0.32
const SFX_LEVEL = 0.75
const lastPlayed: Partial<Record<SfxName, number>> = {}
const MIN_GAP: Partial<Record<SfxName, number>> = {
  poke: 0.05,
  build: 0.08,
  birth: 0.3,
  death: 0.15,
  ignite: 0.4,
  error: 0.4,
  select: 0.04,
  chop: 0.12,
  zap: 0.08,
  alienHit: 0.1,
  alienDie: 0.1,
  abduct: 1,
}

function createImpulse(c: AudioContext, seconds: number, decay: number) {
  const rate = c.sampleRate
  const len = Math.floor(rate * seconds)
  const buf = c.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function createNoise(c: AudioContext) {
  const len = c.sampleRate * 2
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function init() {
  if (ctx || typeof window === 'undefined') return
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.9
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)

  reverb = ctx.createConvolver()
  reverb.buffer = createImpulse(ctx, 3.2, 2.6)
  reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.55
  reverbSend.connect(reverb).connect(master)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = settings.sfx ? SFX_LEVEL : 0
  sfxBus.connect(master)

  musicBus = ctx.createGain()
  musicBus.gain.value = 0
  musicBus.connect(master)

  noiseBuffer = createNoise(ctx)

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else ctx.resume()
  })
}

export function unlockAudio() {
  init()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  if (settings.music) startMusic()
}

// ---------- settings ----------

function emitSettings() {
  for (const l of listeners) l()
}

export function toggleMusic() {
  settings = { ...settings, music: !settings.music }
  if (ctx) {
    if (settings.music) startMusic()
    else stopMusic()
  }
  emitSettings()
}

export function toggleSfx() {
  settings = { ...settings, sfx: !settings.sfx }
  if (ctx) sfxBus.gain.setTargetAtTime(settings.sfx ? SFX_LEVEL : 0, ctx.currentTime, 0.05)
  emitSettings()
}

export function useAudioSettings() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
    () => settings,
  )
}

// ---------- primitives ----------

interface ToneOpts {
  freq: number
  to?: number
  type?: OscillatorType
  start?: number
  attack?: number
  dur: number
  gain: number
  wet?: number
  detune?: number
  dest?: AudioNode
}

function tone(o: ToneOpts) {
  if (!ctx) return
  const t = ctx.currentTime + (o.start ?? 0)
  const osc = ctx.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur)
  if (o.detune) osc.detune.value = o.detune
  const g = ctx.createGain()
  const attack = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.dur)
  osc.connect(g)
  const dest = o.dest ?? sfxBus
  g.connect(dest)
  if (o.wet) {
    const s = ctx.createGain()
    s.gain.value = o.wet
    g.connect(s).connect(reverbSend)
  }
  osc.start(t)
  osc.stop(t + attack + o.dur + 0.05)
}

interface NoiseOpts {
  type: BiquadFilterType
  freq: number
  to?: number
  q?: number
  start?: number
  attack?: number
  dur: number
  gain: number
  wet?: number
}

function noise(o: NoiseOpts) {
  if (!ctx) return
  const t = ctx.currentTime + (o.start ?? 0)
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = o.type
  f.Q.value = o.q ?? 1
  f.frequency.setValueAtTime(o.freq, t)
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + (o.attack ?? 0.005) + o.dur)
  const g = ctx.createGain()
  const attack = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.dur)
  src.connect(f).connect(g).connect(sfxBus)
  if (o.wet) {
    const s = ctx.createGain()
    s.gain.value = o.wet
    g.connect(s).connect(reverbSend)
  }
  src.start(t, Math.random() * 1.5)
  src.stop(t + attack + o.dur + 0.05)
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
const rand = (a: number, b: number) => a + Math.random() * (b - a)

function bell(note: number, start: number, gain = 0.12, dur = 1.2) {
  const f = midi(note)
  tone({ freq: f, start, dur, gain, wet: 0.6 })
  tone({ freq: f * 2.01, start, dur: dur * 0.5, gain: gain * 0.35, wet: 0.6 })
  tone({ freq: f * 3.98, start, dur: dur * 0.25, gain: gain * 0.12, wet: 0.6 })
}

// ---------- sound effects ----------

export function sfx(name: SfxName) {
  if (!ctx || !settings.sfx) return
  const now = ctx.currentTime
  const gap = MIN_GAP[name]
  if (gap && now - (lastPlayed[name] ?? -1) < gap) return
  lastPlayed[name] = now

  switch (name) {
    case 'select':
      tone({ freq: 1040, to: 1380, dur: 0.07, gain: 0.07, type: 'sine' })
      break
    case 'poke': {
      const n = 76 + [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)]
      tone({ freq: midi(n), dur: 0.18, gain: 0.12, type: 'triangle', wet: 0.3 })
      break
    }
    case 'error':
      tone({ freq: 220, to: 180, dur: 0.16, gain: 0.1, type: 'triangle' })
      tone({ freq: 233, to: 190, start: 0.1, dur: 0.18, gain: 0.08, type: 'triangle' })
      break
    case 'build':
      tone({ freq: rand(170, 210), to: 90, dur: 0.12, gain: 0.25, type: 'triangle' })
      noise({ type: 'bandpass', freq: 1800, q: 2, dur: 0.06, gain: 0.18 })
      tone({ freq: rand(230, 270), to: 120, start: 0.14, dur: 0.1, gain: 0.18, type: 'triangle' })
      break
    case 'complete':
      ;[72, 76, 79, 84].forEach((n, i) => bell(n, i * 0.09, 0.1, 1.2))
      break
    case 'grove':
      noise({ type: 'bandpass', freq: 900, to: 3200, q: 0.8, attack: 0.2, dur: 0.7, gain: 0.08, wet: 0.4 })
      ;[79, 83, 86].forEach((n, i) => tone({ freq: midi(n), start: 0.1 + i * 0.08, dur: 0.5, gain: 0.06, wet: 0.7 }))
      break
    case 'thunder':
      noise({ type: 'highpass', freq: 2200, dur: 0.12, gain: 0.55 })
      noise({ type: 'lowpass', freq: 900, to: 120, start: 0.03, attack: 0.02, dur: 2.4, gain: 0.7, wet: 0.5 })
      tone({ freq: 70, to: 35, start: 0.05, dur: 1.6, gain: 0.35, type: 'sine' })
      break
    case 'meteorFall':
      noise({ type: 'bandpass', freq: 300, to: 2400, q: 1.5, attack: 1.1, dur: 0.3, gain: 0.3, wet: 0.3 })
      tone({ freq: 900, to: 180, attack: 0.9, dur: 0.5, gain: 0.05, type: 'sawtooth' })
      break
    case 'meteorImpact':
      tone({ freq: 90, to: 28, dur: 1.8, gain: 0.8, type: 'sine' })
      noise({ type: 'lowpass', freq: 2500, to: 80, dur: 3.2, gain: 0.85, wet: 0.6 })
      noise({ type: 'highpass', freq: 3000, dur: 0.18, gain: 0.4 })
      break
    case 'quake':
      noise({ type: 'lowpass', freq: 220, to: 60, attack: 0.3, dur: 2.6, gain: 0.9, wet: 0.3 })
      tone({ freq: 46, to: 32, attack: 0.2, dur: 2.4, gain: 0.45, type: 'triangle' })
      for (let i = 0; i < 6; i++) noise({ type: 'bandpass', freq: rand(300, 700), q: 3, start: rand(0.1, 1.8), dur: 0.12, gain: 0.2 })
      break
    case 'tornado':
      noise({ type: 'bandpass', freq: 500, to: 1400, q: 4, attack: 0.6, dur: 3, gain: 0.35, wet: 0.4 })
      noise({ type: 'bandpass', freq: 1200, to: 600, q: 6, attack: 0.8, dur: 2.6, gain: 0.2 })
      break
    case 'blessing':
      ;[60, 67, 72, 76, 79].forEach((n) =>
        tone({ freq: midi(n), attack: 0.35, dur: 1.8, gain: 0.05, wet: 0.9, detune: rand(-8, 8) }),
      )
      ;[84, 88, 91, 96].forEach((n, i) => bell(n, 0.25 + i * 0.12, 0.05, 1.4))
      break
    case 'death':
      tone({ freq: 523, to: 196, dur: 0.9, gain: 0.08, type: 'sine', wet: 0.6 })
      tone({ freq: 392, to: 147, start: 0.12, dur: 0.9, gain: 0.05, type: 'sine', wet: 0.6 })
      break
    case 'birth':
      tone({ freq: midi(88), to: midi(93), dur: 0.12, gain: 0.05, wet: 0.5 })
      tone({ freq: midi(95), start: 0.1, dur: 0.25, gain: 0.04, wet: 0.6 })
      break
    case 'ignite':
      noise({ type: 'bandpass', freq: 1600, q: 0.7, attack: 0.15, dur: 0.6, gain: 0.18 })
      for (let i = 0; i < 5; i++) noise({ type: 'highpass', freq: 3500, start: rand(0, 0.6), dur: 0.03, gain: 0.15 })
      break
    case 'ageUp':
      ;[48, 55, 60, 64, 67, 72].forEach((n) =>
        tone({ freq: midi(n), attack: 0.5, dur: 2.6, gain: 0.06, type: 'triangle', wet: 0.8, detune: rand(-6, 6) }),
      )
      ;[72, 76, 79, 84, 88].forEach((n, i) => bell(n, 0.4 + i * 0.14, 0.08, 1.6))
      break
    case 'objective':
      ;[79, 84, 88].forEach((n, i) => bell(n, i * 0.11, 0.09, 1.3))
      break
    case 'challengeStart':
      tone({ freq: midi(62), attack: 0.08, dur: 0.5, gain: 0.08, type: 'triangle', wet: 0.6 })
      tone({ freq: midi(69), start: 0.28, attack: 0.08, dur: 0.8, gain: 0.08, type: 'triangle', wet: 0.6 })
      break
    case 'challengeWon':
      ;[72, 76, 79, 84, 88, 91].forEach((n, i) => bell(n, i * 0.08, 0.08, 1.4))
      break
    case 'challengeLost':
      ;[69, 65, 62, 57].forEach((n, i) =>
        tone({ freq: midi(n), start: i * 0.2, attack: 0.03, dur: 0.6, gain: 0.07, type: 'triangle', wet: 0.6 }),
      )
      break
    case 'start':
      ;[60, 64, 67, 72, 76].forEach((n, i) => bell(n, i * 0.12, 0.08, 1.8))
      break
    case 'tether':
      tone({ freq: midi(81), to: midi(88), dur: 0.18, gain: 0.06, wet: 0.5 })
      tone({ freq: midi(93), start: 0.06, dur: 0.3, gain: 0.03, wet: 0.7 })
      break
    case 'assign':
      ;[76, 83].forEach((n, i) => tone({ freq: midi(n), start: i * 0.07, dur: 0.22, gain: 0.07, type: 'triangle', wet: 0.5 }))
      break
    case 'chop':
      tone({ freq: rand(320, 380), to: 140, dur: 0.06, gain: 0.16, type: 'triangle' })
      noise({ type: 'bandpass', freq: 2400, q: 3, dur: 0.04, gain: 0.12 })
      break
    case 'ufoArrive':
      tone({ freq: 220, to: 880, attack: 0.4, dur: 1.4, gain: 0.05, type: 'sawtooth', wet: 0.7 })
      tone({ freq: 233, to: 660, attack: 0.4, dur: 1.4, gain: 0.04, type: 'square', wet: 0.7 })
      for (let i = 0; i < 4; i++) tone({ freq: midi(84 + (i % 2) * 3), start: 1 + i * 0.16, dur: 0.14, gain: 0.04, type: 'square', wet: 0.5 })
      break
    case 'ufoLand':
      tone({ freq: 160, to: 60, dur: 0.6, gain: 0.25, type: 'sine' })
      noise({ type: 'lowpass', freq: 800, to: 100, dur: 0.8, gain: 0.3, wet: 0.3 })
      break
    case 'zap':
      tone({ freq: rand(1600, 2000), to: 300, dur: 0.12, gain: 0.05, type: 'square' })
      break
    case 'alienHit':
      tone({ freq: 700, to: 420, dur: 0.1, gain: 0.06, type: 'square' })
      break
    case 'alienDie':
      tone({ freq: 900, to: 120, dur: 0.35, gain: 0.08, type: 'sawtooth', wet: 0.3 })
      noise({ type: 'bandpass', freq: 1400, q: 2, dur: 0.15, gain: 0.12 })
      break
    case 'ufoExplode':
      tone({ freq: 120, to: 30, dur: 1.4, gain: 0.6, type: 'sine' })
      noise({ type: 'lowpass', freq: 3000, to: 120, dur: 2.2, gain: 0.7, wet: 0.5 })
      tone({ freq: 1400, to: 100, dur: 0.8, gain: 0.06, type: 'sawtooth', wet: 0.4 })
      break
    case 'abduct':
      tone({ freq: 300, to: 1200, attack: 0.3, dur: 1.2, gain: 0.05, type: 'sine', wet: 0.8 })
      tone({ freq: 305, to: 1210, attack: 0.3, dur: 1.2, gain: 0.04, type: 'triangle', wet: 0.8 })
      break
  }
}

// ---------- continuous loops (sun / rain) ----------

interface Loop {
  gain: GainNode
  level: number
}
const loops: Partial<Record<LoopName, Loop>> = {}

function buildLoop(name: LoopName): Loop | null {
  if (!ctx) return null
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(sfxBus)
  if (name === 'rain') {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer
    src.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 700
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 6500
    src.connect(hp).connect(lp).connect(gain)
    src.start()
    return { gain, level: 0.22 }
  }
  const tremolo = ctx.createGain()
  tremolo.gain.value = 0.7
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 3.2
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.3
  lfo.connect(lfoGain).connect(tremolo.gain)
  lfo.start()
  ;[72, 79, 84, 88].forEach((n, i) => {
    const osc = ctx!.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = midi(n)
    osc.detune.value = i * 4 - 6
    const g = ctx!.createGain()
    g.gain.value = 0.25 / (i + 1)
    osc.connect(g).connect(tremolo)
    osc.start()
  })
  tremolo.connect(gain)
  const send = ctx.createGain()
  send.gain.value = 0.5
  gain.connect(send).connect(reverbSend)
  return { gain, level: 0.05 }
}

export function setLoop(name: LoopName, active: boolean) {
  if (!ctx) return
  let loop = loops[name]
  if (!loop) {
    if (!active) return
    loop = buildLoop(name) ?? undefined
    if (!loop) return
    loops[name] = loop
  }
  const target = active && settings.sfx ? loop.level : 0
  if (Math.abs(loop.gain.gain.value - target) > 0.001) loop.gain.gain.setTargetAtTime(target, ctx.currentTime, active ? 0.12 : 0.3)
}

// ---------- generative ambient music ----------

const CHORDS = [
  [48, 55, 60, 64, 71],
  [45, 52, 57, 60, 67],
  [41, 48, 57, 60, 64],
  [43, 50, 55, 59, 62],
]
const PENTATONIC = [72, 74, 76, 79, 81, 84, 86, 88]
const BAR = 6.4

let musicTimer: ReturnType<typeof setInterval> | null = null
let melodyTimer: ReturnType<typeof setInterval> | null = null
let chordIndex = 0
let lastMelodyNote = 79

function padChord(notes: number[]) {
  if (!ctx) return
  const t = ctx.currentTime + 0.05
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(700, t)
  filter.frequency.linearRampToValueAtTime(1500, t + BAR * 0.5)
  filter.frequency.linearRampToValueAtTime(800, t + BAR * 1.4)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.09, t + 2.2)
  g.gain.setValueAtTime(0.09, t + BAR - 0.4)
  g.gain.linearRampToValueAtTime(0.0001, t + BAR + 2.4)
  filter.connect(g)
  g.connect(musicBus)
  const send = ctx.createGain()
  send.gain.value = 0.7
  g.connect(send).connect(reverbSend)
  for (const n of notes) {
    for (const d of [-7, 7]) {
      const osc = ctx.createOscillator()
      osc.type = n < 50 ? 'sine' : 'triangle'
      osc.frequency.value = midi(n)
      osc.detune.value = d
      const og = ctx.createGain()
      og.gain.value = n < 50 ? 0.5 : 0.22
      osc.connect(og).connect(filter)
      osc.start(t)
      osc.stop(t + BAR + 2.6)
    }
  }
}

function melodyNote() {
  if (!ctx || Math.random() > 0.42) return
  const idx = PENTATONIC.indexOf(lastMelodyNote)
  const step = Math.floor(Math.random() * 5) - 2
  const next = PENTATONIC[Math.max(0, Math.min(PENTATONIC.length - 1, idx + step))]
  lastMelodyNote = next
  const f = midi(next)
  tone({ freq: f, dur: 2.2, gain: 0.035, attack: 0.01, wet: 1, dest: musicBus })
  tone({ freq: f * 2, dur: 0.9, gain: 0.01, attack: 0.01, wet: 1, dest: musicBus })
}

function startMusic() {
  if (!ctx || musicTimer) return
  musicBus.gain.cancelScheduledValues(ctx.currentTime)
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL, ctx.currentTime, 1.5)
  const playBar = () => {
    padChord(CHORDS[chordIndex % CHORDS.length])
    chordIndex++
  }
  playBar()
  musicTimer = setInterval(playBar, BAR * 1000)
  melodyTimer = setInterval(melodyNote, (BAR / 4) * 1000)
}

function stopMusic() {
  if (!ctx) return
  musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
  if (musicTimer) clearInterval(musicTimer)
  if (melodyTimer) clearInterval(melodyTimer)
  musicTimer = null
  melodyTimer = null
}
