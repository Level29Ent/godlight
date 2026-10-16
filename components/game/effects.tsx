'use client'

import { useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import {
  AdditiveBlending,
  CapsuleGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  Quaternion,
  Color,
} from 'three'
import { surfaceQuaternion } from '@/lib/game/orient'
import { PLANET_RADIUS, surfacePoint } from '@/lib/game/planet'
import {
  meteorPosition,
  state,
  useGame,
  type Bolt,
  type Meteor,
  type Shockwave,
  type ShockwaveTone,
  type Tornado,
} from '@/lib/game/store'

export function Effects() {
  const bolts = useGame((s) => s.bolts)
  const meteors = useGame((s) => s.meteors)
  const shockwaves = useGame((s) => s.shockwaves)
  const tornadoes = useGame((s) => s.tornadoes)
  return (
    <group>
      {bolts.map((b) => (
        <LightningBolt key={b.id} bolt={b} />
      ))}
      {meteors.map((m) => (
        <MeteorMesh key={m.id} meteor={m} />
      ))}
      {shockwaves.map((s) => (
        <ShockwaveMesh key={s.id} wave={s} />
      ))}
      {tornadoes.map((t) => (
        <TornadoMesh key={t.id} tornado={t} />
      ))}
      <Ghosts />
      <Flash />
    </group>
  )
}

function LightningBolt({ bolt }: { bolt: Bolt }) {
  const core = useRef<ComponentRef<typeof Line>>(null)
  const glow = useRef<ComponentRef<typeof Line>>(null)

  useLayoutEffect(() => {
    for (const l of [core.current, glow.current]) {
      if (!l) continue
      l.material.toneMapped = false
      l.material.transparent = true
    }
    core.current?.material.color.setRGB(6, 6, 9)
    glow.current?.material.color.setRGB(1.2, 1.4, 3.5)
  }, [])

  useFrame(() => {
    const life = 1 - bolt.t / 0.45
    const flicker = Math.random() > 0.25 ? 1 : 0.2
    if (core.current) core.current.material.opacity = life * flicker
    if (glow.current) glow.current.material.opacity = life * 0.6 * flicker
  })

  return (
    <group>
      <Line ref={glow} points={bolt.points} lineWidth={10} raycast={() => null} />
      <Line ref={core} points={bolt.points} lineWidth={3} raycast={() => null} />
    </group>
  )
}

function MeteorMesh({ meteor }: { meteor: Meteor }) {
  const group = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    meteorPosition(meteor, group.current.position)
    group.current.rotation.set(clock.elapsedTime * 4, clock.elapsedTime * 3, 0)
  })
  return (
    <group ref={group}>
      <mesh raycast={() => null}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#3a2a22" emissive="#ff5a1f" emissiveIntensity={2.5} flatShading />
      </mesh>
      <mesh raycast={() => null}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshBasicMaterial color={[3, 1.2, 0.3]} transparent opacity={0.35} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight color="#ff7a2f" intensity={40} distance={8} decay={1.5} />
    </group>
  )
}

const TONE_COLORS: Record<ShockwaveTone, { ring: [number, number, number]; dome: [number, number, number] }> = {
  fire: { ring: [3, 1.6, 0.6], dome: [3.5, 1.6, 0.4] },
  gold: { ring: [3.2, 2.6, 1.1], dome: [2.6, 2.1, 0.9] },
  earth: { ring: [1.1, 0.8, 0.5], dome: [0.5, 0.38, 0.26] },
  life: { ring: [0.7, 2.6, 0.9], dome: [0.4, 1.6, 0.5] },
}

function ShockwaveMesh({ wave }: { wave: Shockwave }) {
  const ring = useRef<Mesh>(null)
  const dome = useRef<Mesh>(null)
  const quaternion = useMemo(() => surfaceQuaternion(wave.normal, 0, new Quaternion()), [wave])
  const colors = TONE_COLORS[wave.tone] ?? TONE_COLORS.fire
  const ringMat = useMemo(
    () => new MeshBasicMaterial({ color: new Color(...colors.ring), transparent: true, toneMapped: false, depthWrite: false, blending: AdditiveBlending }),
    [colors],
  )

  useFrame(() => {
    const p = wave.t / 1.4
    const ease = 1 - Math.pow(1 - p, 3)
    if (ring.current) ring.current.scale.setScalar(0.1 + ease * wave.size)
    ringMat.opacity = Math.max(0, 1 - p)
    if (dome.current) {
      dome.current.scale.setScalar(0.1 + ease * wave.size * 0.55)
      ;(dome.current.material as MeshBasicMaterial).opacity = Math.max(0, 0.7 - p * 1.2)
    }
  })

  return (
    <group position={wave.pos} quaternion={quaternion}>
      <mesh ref={ring} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} raycast={() => null}>
        <ringGeometry args={[0.8, 1, 64]} />
      </mesh>
      <mesh ref={dome} raycast={() => null}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={colors.dome} transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}

const FUNNEL_RINGS = 9

function TornadoMesh({ tornado }: { tornado: Tornado }) {
  const root = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const fade = useRef(0)

  useFrame(({ clock }, dt) => {
    if (!root.current || !spin.current) return
    surfacePoint(tornado.dir, root.current.position, -0.05)
    surfaceQuaternion(tornado.dir, 0, root.current.quaternion)
    const remaining = tornado.life - tornado.t
    const target = Math.min(1, tornado.t / 0.8, remaining / 1.2)
    fade.current += (target - fade.current) * Math.min(1, dt * 6)
    root.current.scale.setScalar(Math.max(0.01, fade.current))
    spin.current.rotation.y = clock.elapsedTime * 7
    spin.current.children.forEach((c, i) => {
      c.position.x = Math.sin(clock.elapsedTime * 3 + i * 0.7) * 0.05 * i
      c.position.z = Math.cos(clock.elapsedTime * 2.4 + i * 0.6) * 0.04 * i
    })
  })

  return (
    <group ref={root}>
      <group ref={spin}>
        {Array.from({ length: FUNNEL_RINGS }, (_, i) => {
          const h = i / (FUNNEL_RINGS - 1)
          const r = 0.08 + h * h * 0.55
          return (
            <mesh key={i} position={[0, 0.1 + h * 2.1, 0]} rotation={[Math.PI / 2, 0, i]} raycast={() => null}>
              <torusGeometry args={[r, 0.04 + h * 0.09, 6, 24]} />
              <meshStandardMaterial color="#9a8f86" transparent opacity={0.55 - h * 0.15} roughness={1} depthWrite={false} />
            </mesh>
          )
        })}
      </group>
      <mesh position={[0, 1.1, 0]} raycast={() => null}>
        <coneGeometry args={[0.55, 2.3, 24, 1, true]} />
        <meshStandardMaterial color="#b8aea4" transparent opacity={0.18} side={2} depthWrite={false} />
      </mesh>
    </group>
  )
}

const MAX_GHOSTS = 40

function Ghosts() {
  const mesh = useRef<InstancedMesh>(null)
  const geo = useMemo(() => {
    const g = new CapsuleGeometry(0.06, 0.14, 4, 10)
    g.translate(0, 0.13, 0)
    return g
  }, [])
  const tmp = useMemo(() => ({ obj: new Object3D() }), [])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    const n = Math.min(state.ghosts.length, MAX_GHOSTS)
    for (let i = 0; i < n; i++) {
      const g = state.ghosts[i]
      const { obj } = tmp
      obj.position.copy(g.pos)
      surfaceQuaternion(g.up, Math.sin(clock.elapsedTime * 3 + i) * 0.4, obj.quaternion)
      const s = 1.3 * (1 - g.t / 3)
      obj.scale.set(s * (1 + Math.sin(clock.elapsedTime * 6 + i) * 0.1), s, s)
      obj.updateMatrix()
      m.setMatrixAt(i, obj.matrix)
    }
    m.count = n
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, MAX_GHOSTS]} frustumCulled={false} raycast={() => null}>
      <meshBasicMaterial color={[1.2, 1.3, 1.6]} transparent opacity={0.45} toneMapped={false} depthWrite={false} />
    </instancedMesh>
  )
}

function Flash() {
  const light = useRef<PointLight>(null)
  useFrame(() => {
    if (!light.current) return
    light.current.position.copy(state.flash.pos)
    light.current.intensity = state.flash.intensity
  })
  return <pointLight ref={light} color="#dfe8ff" distance={PLANET_RADIUS * 2} decay={1.4} intensity={0} />
}

