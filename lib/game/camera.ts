import { Vector3 } from 'three'

export type CameraAxis = 'yaw' | 'pitch' | 'zoom'

type AxisValues = Record<CameraAxis, number>

export const cameraInput = {
  keys: { yaw: 0, pitch: 0, zoom: 0 } as AxisValues,
  focus: null as Vector3 | null,
  /** Set by a scene handler when the current pointer press belongs to a tool, so it doesn't spin the world. */
  claimed: false,
}

export function claimPointer() {
  cameraInput.claimed = true
}

export function setKeyAxes(values: AxisValues) {
  Object.assign(cameraInput.keys, values)
}

export function axisValue(axis: CameraAxis) {
  return Math.max(-1, Math.min(1, cameraInput.keys[axis]))
}

export function focusCamera(dir: Vector3) {
  cameraInput.focus = dir.clone().normalize()
}
