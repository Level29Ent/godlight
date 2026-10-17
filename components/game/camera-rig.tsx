'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { axisValue, cameraInput, focusCamera, setKeyAxes } from '@/lib/game/camera'
import { cancelTether, releaseCursor, startDir, state, useGame } from '@/lib/game/store'
import { PLANET_RADIUS } from '@/lib/game/planet'

const MIN_DIST = PLANET_RADIUS + 3
const MAX_DIST = PLANET_RADIUS * 4.4
const MIN_POLAR = 0.12
const MAX_POLAR = Math.PI - 0.12
const ROTATE_SPEED = 1.6
const ZOOM_SPEED = 9
const AUTO_ROTATE_SPEED = 0.05
const INERTIA_DECAY = 3.5
const MAX_SPIN = 6
const SWIPE_WINDOW_MS = 220
const SWIPE_THRESHOLD_PX = 14
const UP = new Vector3(0, 1, 0)

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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

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

type Gesture = {
  pendingYaw: number
  pendingPolar: number
  pendingZoom: number
  spinYaw: number
  spinPolar: number
  dragging: boolean
}

/**
 * Grab-to-spin: dragging rotates the world so the land under the finger
 * follows it, two fingers pinch to zoom, and releasing keeps some momentum.
 * Pointers claimed by a tool (powers, building, grabbing a follower) are skipped.
 */
function useGrabControls(gesture: React.RefObject<Gesture>) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = 'none'
    const g = gesture.current
    const pointers = new Map<number, { x: number; y: number }>()
    let lastX = 0
    let lastY = 0
    let lastSpread = 0
    let lastTime = 0
    let powerPress: { x: number; y: number; t: number } | null = null

    const centroid = () => {
      let x = 0
      let y = 0
      pointers.forEach((p) => {
        x += p.x
        y += p.y
      })
      return { x: x / pointers.size, y: y / pointers.size }
    }
    const spread = () => {
      const [a, b] = [...pointers.values()]
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
    }
    const resetAnchor = () => {
      const c = centroid()
      lastX = c.x
      lastY = c.y
      lastSpread = pointers.size >= 2 ? spread() : 0
      lastTime = performance.now()
    }
    const radiansPerPixel = () => {
      const dist = camera.position.length()
      const fov = (camera.fov * Math.PI) / 180
      const frontDist = Math.max(0.5, dist - PLANET_RADIUS)
      return (2 * frontDist * Math.tan(fov / 2)) / (Math.max(1, el.clientHeight) * PLANET_RADIUS)
    }

    const onDown = (e: PointerEvent) => {
      if (e.target !== el) return
      const claimed = cameraInput.claimed && e.button === 0
      cameraInput.claimed = false
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1 && claimed) {
        powerPress = state.cursor.down ? { x: e.clientX, y: e.clientY, t: performance.now() } : null
        return
      }
      powerPress = null
      if (pointers.size >= 2) {
        if (state.tether.dragging) cancelTether()
        if (state.cursor.down) releaseCursor()
      }
      g.dragging = true
      g.spinYaw = 0
      g.spinPolar = 0
      cameraInput.focus = null
      resetAnchor()
    }

    const onMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      p.x = e.clientX
      p.y = e.clientY
      if (!g.dragging && powerPress) {
        // A quick swipe grabs the world; pressing and holding still keeps the power active.
        const moved = Math.hypot(e.clientX - powerPress.x, e.clientY - powerPress.y)
        if (performance.now() - powerPress.t > SWIPE_WINDOW_MS) powerPress = null
        else if (moved > SWIPE_THRESHOLD_PX) {
          lastX = powerPress.x
          lastY = powerPress.y
          powerPress = null
          releaseCursor()
          g.dragging = true
          g.spinYaw = 0
          g.spinPolar = 0
          cameraInput.focus = null
          lastTime = performance.now()
        }
      }
      if (!g.dragging) return
      const c = centroid()
      const k = radiansPerPixel()
      const yaw = -(c.x - lastX) * k
      const polar = -(c.y - lastY) * k
      lastX = c.x
      lastY = c.y
      g.pendingYaw += yaw
      g.pendingPolar += polar
      if (pointers.size >= 2) {
        const s = spread()
        if (lastSpread > 0 && s > 0) g.pendingZoom *= lastSpread / s
        lastSpread = s
      }
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      if (dt > 0) {
        g.spinYaw = g.spinYaw * 0.5 + clamp(yaw / dt, -MAX_SPIN, MAX_SPIN) * 0.5
        g.spinPolar = g.spinPolar * 0.5 + clamp(polar / dt, -MAX_SPIN, MAX_SPIN) * 0.5
      }
      lastTime = now
    }

    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return
      powerPress = null
      if (pointers.size > 0) {
        if (g.dragging) resetAnchor()
        return
      }
      if (g.dragging && performance.now() - lastTime > 90) {
        g.spinYaw = 0
        g.spinPolar = 0
      }
      g.dragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraInput.focus = null
      g.pendingZoom *= Math.exp(clamp(e.deltaY, -120, 120) * 0.0015)
    }

    const onContextMenu = (e: Event) => e.preventDefault()

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl, camera, gesture])
}

function orbit(dir: Vector3, right: Vector3, yaw: number, polarDelta: number) {
  if (yaw !== 0) dir.applyAxisAngle(UP, yaw)
  if (polarDelta !== 0) {
    const polar = Math.acos(clamp(dir.y, -1, 1))
    const next = clamp(polar + polarDelta, MIN_POLAR, MAX_POLAR)
    right.crossVectors(UP, dir)
    if (right.lengthSq() > 1e-8) dir.applyAxisAngle(right.normalize(), next - polar)
  }
}

export function CameraRig() {
  const started = useGame((s) => s.started)
  const gesture = useRef<Gesture>({
    pendingYaw: 0,
    pendingPolar: 0,
    pendingZoom: 1,
    spinYaw: 0,
    spinPolar: 0,
    dragging: false,
  })
  useKeyboardCamera()
  useGrabControls(gesture)

  const tmp = useRef({ q: new Quaternion(), dir: new Vector3(), right: new Vector3() })

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = gesture.current
    const { q, dir, right } = tmp.current
    const dist = camera.position.length()
    dir.copy(camera.position).normalize()

    let yaw = axisValue('yaw') * ROTATE_SPEED * dt + g.pendingYaw
    let polar = axisValue('pitch') * ROTATE_SPEED * dt + g.pendingPolar
    g.pendingYaw = 0
    g.pendingPolar = 0

    if (!g.dragging && (g.spinYaw !== 0 || g.spinPolar !== 0)) {
      yaw += g.spinYaw * dt
      polar += g.spinPolar * dt
      const decay = Math.exp(-INERTIA_DECAY * dt)
      g.spinYaw = Math.abs(g.spinYaw) < 0.01 ? 0 : g.spinYaw * decay
      g.spinPolar = Math.abs(g.spinPolar) < 0.01 ? 0 : g.spinPolar * decay
    }
    if (!started && !g.dragging) yaw += AUTO_ROTATE_SPEED * dt

    const userMoved = yaw !== 0 || polar !== 0
    orbit(dir, right, yaw, polar)

    const focus = cameraInput.focus
    if (focus) {
      if (g.dragging || axisValue('yaw') !== 0 || axisValue('pitch') !== 0) cameraInput.focus = null
      else {
        const target = focus.clone()
        const tPolar = Math.acos(clamp(target.y, -1, 1))
        if (tPolar < MIN_POLAR || tPolar > MAX_POLAR) {
          const clamped = clamp(tPolar, MIN_POLAR, MAX_POLAR)
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
          dir.applyQuaternion(new Quaternion().slerp(q, step / angle))
        }
      }
    }

    const keyZoom = axisValue('zoom') * ZOOM_SPEED * dt
    const nextDist = clamp(dist * g.pendingZoom + keyZoom, MIN_DIST, MAX_DIST)
    g.pendingZoom = 1

    if (userMoved || focus || nextDist !== dist) {
      camera.position.copy(dir.normalize()).multiplyScalar(nextDist)
    }
    camera.up.copy(UP)
    camera.lookAt(0, 0, 0)
    state.viewDir.copy(camera.position).normalize()
  })

  return null
}
