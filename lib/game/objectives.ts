import type { GameState } from './store'

export interface ObjectiveDef {
  id: string
  title: string
  desc: string
  target: number
  reward: number
  progress: (s: GameState) => number
}

export const OBJECTIVES: ObjectiveDef[] = [
  {
    id: 'bless',
    title: 'First Light',
    desc: 'Hold Sunlight over your followers to bless 3 of them.',
    target: 3,
    reward: 15,
    progress: (s) => s.stats.blessed.size,
  },
  {
    id: 'water',
    title: 'Nourish the Fields',
    desc: 'Let Rain fall on a farm for 3 seconds.',
    target: 3,
    reward: 15,
    progress: (s) => s.stats.farmRain,
  },
  {
    id: 'house',
    title: 'A Place to Rest',
    desc: 'Have your followers complete a second house.',
    target: 2,
    reward: 20,
    progress: (s) => s.stats.houses,
  },
  {
    id: 'explore',
    title: 'The Other Side',
    desc: 'Rotate the world to gaze upon its far side. Right-drag, WASD, or the arrows.',
    target: 1,
    reward: 15,
    progress: (s) => (s.stats.farSide ? 1 : 0),
  },
  {
    id: 'pop6',
    title: 'A Growing Flock',
    desc: 'Reach 6 followers.',
    target: 6,
    reward: 20,
    progress: (s) => s.pop,
  },
  {
    id: 'harvest',
    title: 'Bountiful Earth',
    desc: 'Celebrate 2 harvests. Rain and sun make crops grow.',
    target: 2,
    reward: 30,
    progress: (s) => s.harvests,
  },
  {
    id: 'clay',
    title: 'Age of Clay',
    desc: 'Reach 8 followers to advance your civilization.',
    target: 8,
    reward: 25,
    progress: (s) => (s.ageIndex >= 1 ? 8 : s.pop),
  },
  {
    id: 'strike',
    title: 'Fear of the Heavens',
    desc: 'Strike the land with Lightning 3 times.',
    target: 3,
    reward: 15,
    progress: (s) => s.stats.strikes,
  },
  {
    id: 'douse',
    title: 'Merciful Rain',
    desc: 'Put out a fire with Rain.',
    target: 1,
    reward: 25,
    progress: (s) => s.stats.doused,
  },
  {
    id: 'challenge1',
    title: 'Answer the Call',
    desc: 'Win a divine challenge.',
    target: 1,
    reward: 30,
    progress: (s) => s.challengesWon,
  },
  {
    id: 'trees',
    title: 'Gardener of Worlds',
    desc: 'Grow 10 new trees with Rain.',
    target: 10,
    reward: 30,
    progress: (s) => s.stats.treesGrown,
  },
  {
    id: 'temple',
    title: 'House of Worship',
    desc: 'Complete a Temple.',
    target: 1,
    reward: 60,
    progress: (s) => s.stats.temples,
  },
  {
    id: 'farside',
    title: 'Beyond the Horizon',
    desc: 'Complete any building on the far side of the world.',
    target: 1,
    reward: 60,
    progress: (s) => s.stats.farBuildings,
  },
  {
    id: 'iron',
    title: 'Age of Iron',
    desc: 'Reach 22 followers.',
    target: 22,
    reward: 80,
    progress: (s) => (s.ageIndex >= 3 ? 22 : s.pop),
  },
  {
    id: 'meteor',
    title: 'Wrath of the Cosmos',
    desc: 'Call down a Meteor.',
    target: 1,
    reward: 40,
    progress: (s) => s.stats.meteors,
  },
  {
    id: 'challenge5',
    title: 'Proven Divinity',
    desc: 'Win 5 divine challenges.',
    target: 5,
    reward: 100,
    progress: (s) => s.challengesWon,
  },
  {
    id: 'gold',
    title: 'Age of Gold',
    desc: 'Reach 35 followers and usher in a golden age.',
    target: 35,
    reward: 200,
    progress: (s) => (s.ageIndex >= 4 ? 35 : s.pop),
  },
]
