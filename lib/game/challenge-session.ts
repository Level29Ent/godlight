import { exportSave, importSave, startScenario, state } from './store'
import { readLocalWorld, writeLocalWorld } from './local-save'
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
  const saved = readLocalWorld(storage, 'challenge')
  if (!saved) throw new Error('No valid challenge save is available on this device.')
  protectNormal(storage)
  if (!importSave(saved)) throw new Error('Could not restore the challenge save.')
}
