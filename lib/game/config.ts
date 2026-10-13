export type Tool = 'hand' | 'sun' | 'rain' | 'lightning' | 'meteor' | 'house' | 'farm' | 'temple'

export interface ToolInfo {
  id: Tool
  label: string
  cost: number
  unlockAge: number
  kind: 'hand' | 'power' | 'build'
  hint: string
}

export const TOOLS: ToolInfo[] = [
  { id: 'hand', label: 'Touch', cost: 0, unlockAge: 0, kind: 'hand', hint: 'Drag space to spin the world. Tap a follower to bless them.' },
  { id: 'sun', label: 'Sunlight', cost: 0, unlockAge: 0, kind: 'power', hint: 'Hold on the land to warm and cheer followers. Too long and things catch fire.' },
  { id: 'rain', label: 'Rain', cost: 0, unlockAge: 0, kind: 'power', hint: 'Hold to water farms, grow forests, and douse fires.' },
  { id: 'house', label: 'House', cost: 40, unlockAge: 0, kind: 'build', hint: 'Homes for 3 more followers. New souls are born when people are happy.' },
  { id: 'farm', label: 'Farm', cost: 25, unlockAge: 0, kind: 'build', hint: 'Rain + sun grow crops. Each harvest yields faith and joy.' },
  { id: 'lightning', label: 'Lightning', cost: 10, unlockAge: 1, kind: 'power', hint: 'Smite the land. Witnesses pray in fear for a while.' },
  { id: 'temple', label: 'Temple', cost: 150, unlockAge: 2, kind: 'build', hint: 'Followers pilgrimage here. Prayer at a temple yields far more faith.' },
  { id: 'meteor', label: 'Meteor', cost: 60, unlockAge: 3, kind: 'power', hint: 'Call down the heavens. Devastating — and unforgettable.' },
]

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<Tool, ToolInfo>

export const AGES = [
  { name: 'Age of Dust', pop: 0 },
  { name: 'Age of Clay', pop: 8 },
  { name: 'Age of Bronze', pop: 14 },
  { name: 'Age of Iron', pop: 22 },
  { name: 'Age of Gold', pop: 35 },
]

export const ROBE_COLORS = ['#e45d50', '#f2a541', '#4f86c6', '#8e6cc9', '#e8e2d0', '#3fa7a0', '#d9658f', '#6b9f3e']
export const SKIN_COLORS = ['#f1c9a5', '#d9a47a', '#b57b52', '#8a5636', '#f6d6b8']
