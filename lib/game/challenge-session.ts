import { exportSave, importSave, startScenario, returnToTitle, say, state } from './store'
import { readLocalProgress, writeLocalWorld } from './local-save'
import type { Scenario } from './chronicles'

type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'>
function protectNormal(storage: DeviceStorage) {
  if (state.started && !state.chronicle.scenario && !writeLocalWorld(storage, exportSave())) {
    throw new Error('Normal-world backup failed. Free device storage before starting a challenge.')
  }
}
export function beginChallenge(storage: DeviceStorage, kind: Scenario) {
  protectNormal(storage)
  startScenario(kind)
}
export function resumeChallenge(storage: DeviceStorage) {
  const saved = readLocalProgress(storage, 'challenge')
  if (!saved) throw new Error('No valid challenge save is available on this device.')
  protectNormal(storage)
  if (!importSave(saved.data)) throw new Error('Could not restore the challenge save.')
  if (saved.recovered) say('Recovered an older challenge snapshot because the latest device save could not be read.')
}


// Capture the normal snapshot before switching; failed saves leave the current challenge intact.
export function leaveChallenge(storage: DeviceStorage): 'normal' | 'title' {
  if (!state.chronicle.scenario) throw new Error('You are not in a challenge world.')
  const normal = readLocalProgress(storage)
  if (!writeLocalWorld(storage, exportSave())) throw new Error('Challenge save failed. Keep playing or free device storage before leaving. Your normal world is unchanged.')
  if (normal) {
    if (!importSave(normal.data)) throw new Error('Could not restore the normal world. Your challenge was saved.')
    if (normal.recovered) say('Recovered an older normal-world snapshot because the latest device save could not be read.')
    return 'normal'
  }
  returnToTitle()
  return 'title'
}
