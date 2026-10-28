'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { facingQuaternion, surfaceQuaternion } from '@/lib/game/orient'
import { state } from '@/lib/game/store'

const MAX_UFOS = 4
const MAX_ALIENS = 48
const MAX_ZAPS = 24
const ZERO = new Matrix4().makeScale(0, 0, 0)
const Y = new Vector3(0, 1, 0)
const HURT = new Color('#ff3b2f')
const ALIEN_SKIN = new Color('#7ad65a')

export function Invaders() {
  return (
    <group>
      {Array.from({ length: MAX_UFOS }, (_, i) => (
        <UfoView key={i} slot={i} />
      ))}
      <Aliens />
      <Zaps />
    </group>
  )
}

function UfoView({ slot }: { slot: number }) {
  const group = useRef<Group>(null)
  const beam = useRef<Mesh>(null)
  const hull = useRef<MeshStandardMaterial>(null)
  const lights = useRef<Group>(null)
  const tmp = useMemo(() => ({ q: new Quaternion(), p: new Vector3() }), [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const u = state.ufos[slot]
    if (!u || u.t < 0) {
      g.visible = false
      return
    }
    g.visible = true
    const t = clock.elapsedTime
    surfacePoint(u.dir, tmp.p, u.height)
    g.position.copy(tmp.p)
    surfaceQuaternion(u.dir, t * (u.phase === 'landed' ? 0.6 : 2.5), tmp.q)
    g.quaternion.copy(tmp.q)
    if (u.phase !== 'landed') g.position.addScaledVector(u.dir, Math.sin(t * 3 + slot) * 0.05)

    if (hull.current) {
      hull.current.emissive.copy(u.hurt > 0 ? HURT : hull.current.color).multiplyScalar(u.hurt > 0 ? 1.4 : 0.05)
    }
    if (lights.current) {
      lights.current.children.forEach((c, i) => {
        c.visible = Math.floor(t * 6 + i) % 3 !== 0
      })
    }
    if (beam.current) {
      const beaming = u.phase === 'hover' && u.beamTarget !== null
      const landing = u.phase === 'land'
      beam.current.visible = beaming || landing
      const len = Math.max(0.2, u.height - 0.1)
      beam.current.scale.set(1, len, 1)
      beam.current.position.y = -len / 2 - 0.05
      ;(beam.current.material as MeshStandardMaterial).opacity = beaming ? 0.35 + Math.sin(t * 20) * 0.08 : 0.15
    }
  })

  return (
    <group ref={group} visible={false}>
      <mesh castShadow scale={[1, 0.22, 1]}>
        <sphereGeometry args={[0.6, 28, 14]} />
        <meshStandardMaterial ref={hull} color="#a9b4c2" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.26, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7ff0ff" emissive="#3ad0ff" emissiveIntensity={1.2} transparent opacity={0.75} roughness={0.05} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.06, 20]} />
        <meshBasicMaterial color={[0.6, 2.4, 1.2]} toneMapped={false} />
      </mesh>
      <group ref={lights}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56]}>
              <sphereGeometry args={[0.035, 8, 6]} />
              <meshBasicMaterial color={i % 2 ? [2.6, 0.6, 2.2] : [0.6, 2.6, 1.4]} toneMapped={false} />
            </mesh>
          )
        })}
      </group>
      <mesh ref={beam} visible={false} raycast={() => null}>
        <cylinderGeometry args={[0.18, 0.5, 1, 24, 1, true]} />
        <meshBasicMaterial
          color={[0.5, 2.2, 1.4]}
          transparent
          opacity={0.3}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function Aliens() {
  const body = useRef<InstancedMesh>(null)
  const head = useRef<InstancedMesh>(null)
  const eyes = useRef<InstancedMesh>(null)
  const geos = useMemo(() => {
    const b = new CapsuleGeometry(0.035, 0.07, 3, 8)
    b.translate(0, 0.075, 0)
    const h = new SphereGeometry(0.06, 14, 10)
    h.scale(1, 0.85, 0.9)
    h.translate(0, 0.19, 0)
    const e = new SphereGeometry(0.022, 8, 6)
    e.scale(1.3, 0.8, 0.5)
    return { b, h, e }
  }, [])
  const tmp = useMemo(
    () => ({ obj: new Object3D(), q: new Quaternion(), p: new Vector3(), m: new Matrix4(), c: new Color() }),
    [],
  )

  useLayoutEffect(() => {
    for (let i = 0; i < MAX_ALIENS; i++) {
      body.current?.setColorAt(i, ALIEN_SKIN)
      head.current?.setColorAt(i, ALIEN_SKIN)
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const n = Math.min(state.aliens.length, MAX_ALIENS)
    const { obj, q, p, m, c } = tmp
    for (let i = 0; i < n; i++) {
      const a = state.aliens[i]
      surfacePoint(a.dir, p, Math.abs(Math.sin(t * 10 + a.phase)) * 0.02)
      const faced = facingQuaternion(a.dir, a.target, q) ?? surfaceQuaternion(a.dir, a.phase, q)
      obj.position.copy(p)
      obj.quaternion.copy(faced)
      obj.scale.setScalar(1.8)
      obj.rotateZ(Math.sin(t * 10 + a.phase) * 0.08)
      obj.updateMatrix()
      body.current!.setMatrixAt(i, obj.matrix)
      head.current!.setMatrixAt(i, obj.matrix)
      for (const side of [-1, 1]) {
        m.makeTranslation(side * 0.027, 0.195, 0.048)
        m.premultiply(obj.matrix)
        eyes.current!.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), m)
      }
      c.copy(ALIEN_SKIN)
      if (a.hurt > 0) c.copy(HURT).multiplyScalar(2)
      body.current!.setColorAt(i, c)
      head.current!.setColorAt(i, c)
    }
    for (let i = n * 2; i < MAX_ALIENS * 2; i++) eyes.current?.setMatrixAt(i, ZERO)
    for (const mesh of [body.current, head.current, eyes.current]) {
      if (!mesh) continue
      mesh.count = mesh === eyes.current ? n * 2 : n
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={body} args={[geos.b, undefined, MAX_ALIENS]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={head} args={[geos.h, undefined, MAX_ALIENS]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={eyes} args={[geos.e, undefined, MAX_ALIENS * 2]} frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial color="#0b0b12" roughness={0.1} />
      </instancedMesh>
    </group>
  )
}

function Zaps() {
  const mesh = useRef<InstancedMesh>(null)
  const geo = useMemo(() => {
    const g = new CylinderGeometry(0.014, 0.014, 1, 6, 1, true)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const tmp = useMemo(() => ({ obj: new Object3D(), d: new Vector3() }), [])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const n = Math.min(state.zaps.length, MAX_ZAPS)
    const { obj, d } = tmp
    for (let i = 0; i < n; i++) {
      const z = state.zaps[i]
      d.subVectors(z.to, z.from)
      const len = d.length()
      obj.position.copy(z.from)
      obj.quaternion.setFromUnitVectors(Y, d.normalize())
      const w = 1 - z.t / 0.3
      obj.scale.set(w * 1.5 + 0.2, len, w * 1.5 + 0.2)
      obj.updateMatrix()
      m.setMatrixAt(i, obj.matrix)
    }
    m.count = n
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, MAX_ZAPS]} frustumCulled={false} raycast={() => null}>
      <meshBasicMaterial color={[0.8, 3, 1.2]} toneMapped={false} blending={AdditiveBlending} transparent depthWrite={false} />
    </instancedMesh>
  )
}
