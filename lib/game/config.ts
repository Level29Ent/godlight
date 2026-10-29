export type Tool =
  | 'hand'
  | 'sun'
  | 'rain'
  | 'grove'
  | 'house'
  | 'farm'
  | 'well'
  | 'lightning'
  | 'blessing'
  | 'temple'
  | 'quake'
  | 'meteor'
  | 'tornado'
  | 'bounty'
  | 'monument'
  | 'aurora'

export interface ToolInfo {
  id: Tool
  label: string
  cost: number
  unlockAge: number
  kind: 'hand' | 'power' | 'build'
  hint: string
}

export const TOOLS: ToolInfo[] = [
  { id: 'hand', label: 'Touch', cost: 0, unlockAge: 0, kind: 'hand', hint: 'Grab the world and drag to spin it. Pinch to zoom. Tap a follower to bless them.' },
  { id: 'sun', label: 'Sunlight', cost: 0, unlockAge: 0, kind: 'power', hint: 'Hold on the land to warm and cheer followers. Too long and things catch fire.' },
  { id: 'rain', label: 'Rain', cost: 0, unlockAge: 0, kind: 'power', hint: 'Hold to water farms, grow forests, and douse fires.' },
  { id: 'grove', label: 'Grove', cost: 15, unlockAge: 0, kind: 'power', hint: 'Raise a sacred forest in an instant. Followers nearby are delighted.' },
  { id: 'house', label: 'House', cost: 40, unlockAge: 0, kind: 'build', hint: 'Homes for 3 more followers. New souls are born when people are happy.' },
  { id: 'farm', label: 'Farm', cost: 25, unlockAge: 0, kind: 'build', hint: 'Rain + sun grow crops. Each harvest yields faith and joy.' },
  { id: 'well', label: 'Well', cost: 35, unlockAge: 1, kind: 'build', hint: 'A spring of fresh water. Keeps nearby farms moist and followers content.' },
  { id: 'lightning', label: 'Lightning', cost: 10, unlockAge: 1, kind: 'power', hint: 'Smite the land. Witnesses pray in fear for a while.' },
  { id: 'blessing', label: 'Blessing', cost: 40, unlockAge: 2, kind: 'power', hint: 'A golden miracle. Heals people, quenches fires, restores buildings and burnt forests.' },
  { id: 'bounty', label: 'Bounty', cost: 30, unlockAge: 2, kind: 'power', hint: 'A wave of abundance. Ripens nearby crops, soaks the soil, and revives scorched trees.' },
  { id: 'temple', label: 'Temple', cost: 150, unlockAge: 2, kind: 'build', hint: 'Followers pilgrimage here. Prayer at a temple yields far more faith.' },
  { id: 'quake', label: 'Quake', cost: 30, unlockAge: 2, kind: 'power', hint: 'Shake the earth. Topples trees, cracks buildings, and fills hearts with dread.' },
  { id: 'meteor', label: 'Meteor', cost: 60, unlockAge: 3, kind: 'power', hint: 'Call down the heavens. Devastating — and unforgettable.' },
  { id: 'tornado', label: 'Tornado', cost: 50, unlockAge: 3, kind: 'power', hint: 'Unleash a roaming twister that tears through everything in its path.' },
  { id: 'monument', label: 'Monument', cost: 220, unlockAge: 4, kind: 'build', hint: 'A golden obelisk. Radiates faith on its own and lifts the spirits of everyone nearby.' },
  { id: 'aurora', label: 'Aurora', cost: 120, unlockAge: 5, kind: 'power', hint: 'Paint the sky with light. The whole world rejoices and faith flows 50% faster for 30s.' },
]

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<Tool, ToolInfo>

export const AGES = [
  { name: 'Age of Dust', pop: 0 },
  { name: 'Age of Clay', pop: 8 },
  { name: 'Age of Bronze', pop: 14 },
  { name: 'Age of Iron', pop: 22 },
  { name: 'Age of Gold', pop: 35 },
  { name: 'Age of Stars', pop: 50 },
]

export const DAY_LENGTH = 240

export function nightAmount(time: number) {
  const phase = ((time / DAY_LENGTH) % 1) * Math.PI * 2
  const sun = Math.sin(phase)
  return Math.min(1, Math.max(0, (-sun + 0.15) / 0.5))
}

export const ROBE_COLORS = ['#e45d50', '#f2a541', '#4f86c6', '#8e6cc9', '#e8e2d0', '#3fa7a0', '#d9658f', '#6b9f3e']
export const SKIN_COLORS = ['#f1c9a5', '#d9a47a', '#b57b52', '#8a5636', '#f6d6b8']
