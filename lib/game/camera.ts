import { Vector3 } from 'three'

export type CameraAxis = 'yaw' | 'pitch' | 'zoom'

type AxisValues = Record<CameraAxis, number>

export const cameraInput = {
  keys: { yaw: 0, pitch: 0, zoom: 0 } as AxisValues,
  buttons: { yaw: 0, pitch: 0, zoom: 0 } as AxisValues,
  focus: null as Vector3 | null,
}

export function setButtonAxis(axis: CameraAxis, value: number) {
  cameraInput.buttons[axis] = value
}

export function setKeyAxes(values: AxisValues) {
  Object.assign(cameraInput.keys, values)
}

export function axisValue(axis: CameraAxis) {
  return Math.max(-1, Math.min(1, cameraInput.keys[axis] + cameraInput.buttons[axis]))
}

export function focusCamera(dir: Vector3) {
  cameraInput.focus = dir.clone().normalize()
}
