'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { ComponentRef } from 'react'
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>
import { MOUSE, Quaternion, TOUCH, Vector3 } from 'three'
import { axisValue, cameraInput, focusCamera, setKeyAxes } from '@/lib/game/camera'
import { startDir, state, useGame } from '@/lib/game/store'
import { PLANET_RADIUS } from '@/lib/game/planet'

const MIN_DIST = PLANET_RADIUS + 3
const MAX_DIST = PLANET_RADIUS * 4.4
const MIN_POLAR = 0.12
const MAX_POLAR = Math.PI - 0.12
const ROTATE_SPEED = 1.6
const ZOOM_SPEED = 9

const KEY_AXES: Record<string, { axis: 'yaw' | 'pitch' | 'zoom'; value: number }> = {
  a: { axis: 'yaw', value: -1 },
  arrowleft: { axis: 'yaw', value: -1 },
  d: { axis: 'yaw', value: 1 },
  arrowright: { axis: 'yaw', value: 1 },
  w: { axis: 'pitch', value: -1 },
  arrowup: { axis: 'pitch', value: -1 },
  s: { axis: 'pitch', value: 1 },
  arrowdown: { axis: 'pitch', value: 1 },
  q: { axis: 'zoom', value: 1 },
  '-': { axis: 'zoom', value: 1 },
  e: { axis: 'zoom', value: -1 },
  '=': { axis: 'zoom', value: -1 },
  '+': { axis: 'zoom', value: -1 },
}

export function flipView() {
  focusCamera(state.viewDir.clone().negate())
}

export function recenterView() {
  focusCamera(startDir)
}

function useKeyboardCamera() {
  useEffect(() => {
    const held = new Set<string>()
    const sync = () => {
      const v = { yaw: 0, pitch: 0, zoom: 0 }
      held.forEach((k) => {
        const m = KEY_AXES[k]
        if (m) v[m.axis] += m.value
      })
      setKeyAxes(v)
    }
    const isTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    }
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return
      const k = e.key.toLowerCase()
      if (k === 'f') flipView()
      else if (k === 'r' || k === 'home') recenterView()
      if (!KEY_AXES[k]) return
      if (k.startsWith('arrow')) e.preventDefault()
      held.add(k)
      cameraInput.focus = null
      sync()
    }
    const up = (e: KeyboardEvent) => {
      held.delete(e.key.toLowerCase())
      sync()
    }
    const clear = () => {
      held.clear()
      sync()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
}

export function CameraRig() {
  const started = useGame((s) => s.started)
  const controls = useRef<OrbitControlsImpl>(null)
  useKeyboardCamera()

  const tmp = useRef({
    q: new Quaternion(),
    dir: new Vector3(),
    right: new Vector3(),
    up: new Vector3(0, 1, 0),
  })

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const { q, dir, right, up } = tmp.current
    const dist = camera.position.length()
    dir.copy(camera.position).normalize()

    const yaw = axisValue('yaw')
    const pitch = axisValue('pitch')
    const zoom = axisValue('zoom')
    let moved = false

    if (yaw !== 0) {
      q.setFromAxisAngle(up, yaw * ROTATE_SPEED * dt)
      dir.applyQuaternion(q)
      moved = true
    }
    if (pitch !== 0) {
      const polar = Math.acos(Math.max(-1, Math.min(1, dir.y)))
      const next = Math.max(MIN_POLAR, Math.min(MAX_POLAR, polar + pitch * ROTATE_SPEED * dt))
      right.crossVectors(up, dir).normalize()
      if (right.lengthSq() > 0) {
        q.setFromAxisAngle(right, next - polar)
        dir.applyQuaternion(q)
      }
      moved = true
    }

    const focus = cameraInput.focus
    if (focus) {
      if (moved) cameraInput.focus = null
      else {
        const target = focus.clone()
        const polar = Math.acos(Math.max(-1, Math.min(1, target.y)))
        if (polar < MIN_POLAR || polar > MAX_POLAR) {
          const clamped = Math.max(MIN_POLAR, Math.min(MAX_POLAR, polar))
          const flat = new Vector3(target.x, 0, target.z)
          if (flat.lengthSq() < 1e-6) flat.copy(dir).setY(0)
          flat.normalize()
          target.copy(flat.multiplyScalar(Math.sin(clamped))).setY(Math.cos(clamped))
        }
        const angle = dir.angleTo(target)
        if (angle < 0.01) cameraInput.focus = null
        else {
          q.setFromUnitVectors(dir, target)
          const step = Math.min(angle, Math.max(angle * dt * 3.5, 1.2 * dt))
          const t = step / angle
          dir.applyQuaternion(new Quaternion().slerp(q, t))
          moved = true
        }
      }
    }

    let nextDist = dist
    if (zoom !== 0) nextDist = Math.max(MIN_DIST, Math.min(MAX_DIST, dist + zoom * ZOOM_SPEED * dt))

    if (moved || nextDist !== dist) {
      camera.position.copy(dir.normalize()).multiplyScalar(nextDist)
      camera.lookAt(0, 0, 0)
      controls.current?.update()
    }

    state.viewDir.copy(camera.position).normalize()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      minDistance={MIN_DIST}
      maxDistance={MAX_DIST}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      autoRotate={!started}
      autoRotateSpeed={0.5}
      mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
      onStart={() => {
        cameraInput.focus = null
      }}
    />
  )
}
