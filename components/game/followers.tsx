'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Object3D,
  OctahedronGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { facingQuaternion, surfaceQuaternion } from '@/lib/game/orient'
import { beginTether, pokeFollower, state, type Follower, type JobKind } from '@/lib/game/store'

const MAX = 160
const FIRE = new Color(3, 1.1, 0.25)
const GLUM = new Color('#6b6f7a')
const HURT = new Color('#ff5a4a')
const ZERO = new Matrix4().makeScale(0, 0, 0)
const SCALE = 1.8
const HIP = 0.11
const SHOULDER = 0.215

const HAIR_COLORS = ['#2b1d14', '#4a2f1d', '#1c1c1f', '#7a4b26', '#c99a5b', '#5b3b2a'].map((c) => new Color(c))
export const JOB_COLORS: Record<JobKind, Color> = {
  chop: new Color(1.6, 0.95, 0.35),
  mine: new Color(1.1, 1.2, 1.4),
  farm: new Color(0.6, 1.8, 0.45),
  build: new Color(1.8, 1.4, 0.4),
  pray: new Color(1.9, 1.7, 0.9),
  fight: new Color(2.4, 0.45, 0.35),
  guard: new Color(0.5, 1.1, 2.2),
}

type Controls = { enabled: boolean } | null

function isMoving(f: Follower) {
  return f.state === 'wander' || f.state === 'pilgrim' || f.state === 'flee' || f.burning > 0 || f.scared > 0
}

export function Followers() {
  const controls = useThree((s) => s.controls) as Controls
  const refs = {
    legL: useRef<InstancedMesh>(null),
    legR: useRef<InstancedMesh>(null),
    torso: useRef<InstancedMesh>(null),
    armL: useRef<InstancedMesh>(null),
    armR: useRef<InstancedMesh>(null),
    head: useRef<InstancedMesh>(null),
    hair: useRef<InstancedMesh>(null),
    halo: useRef<InstancedMesh>(null),
    marker: useRef<InstancedMesh>(null),
    hit: useRef<InstancedMesh>(null),
  }

  const geos = useMemo(() => {
    const leg = new CapsuleGeometry(0.017, 0.075, 3, 8)
    leg.translate(0, -0.055, 0)
    const torso = new CapsuleGeometry(0.038, 0.07, 4, 10)
    torso.scale(1, 1, 0.72)
    torso.translate(0, 0.165, 0)
    const arm = new CapsuleGeometry(0.013, 0.07, 3, 8)
    arm.translate(0, -0.045, 0)
    const head = new SphereGeometry(0.038, 14, 10)
    head.translate(0, 0.272, 0)
    const hair = new SphereGeometry(0.041, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)
    hair.rotateX(-0.25)
    hair.translate(0, 0.276, -0.004)
    const halo = new TorusGeometry(0.038, 0.008, 6, 24)
    halo.rotateX(Math.PI / 2)
    halo.translate(0, 0.335, 0)
    const marker = new OctahedronGeometry(0.022, 0)
    marker.translate(0, 0.36, 0)
    const hit = new BoxGeometry(0.22, 0.38, 0.22)
    hit.translate(0, 0.17, 0)
    return { leg, torso, arm, head, hair, halo, marker, hit }
  }, [])

  const tmp = useMemo(
    () => ({
      obj: new Object3D(),
      q: new Quaternion(),
      p: new Vector3(),
      c: new Color(),
      local: new Matrix4(),
      rot: new Matrix4(),
      out: new Matrix4(),
    }),
    [],
  )

  useLayoutEffect(() => {
    const white = new Color('#ffffff')
    for (const r of Object.values(refs)) for (let i = 0; i < MAX; i++) r.current?.setColorAt(i, white)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const list = state.followers
    const n = Math.min(list.length, MAX)
    const { obj, q, p, c, local, rot, out } = tmp
    const selected = state.tether.followerId

    const limb = (mesh: InstancedMesh | null, i: number, base: Matrix4, x: number, y: number, swing: number, spread = 0) => {
      local.makeTranslation(x, y, 0)
      rot.makeRotationX(swing)
      if (spread) rot.multiply(out.makeRotationZ(spread))
      local.multiply(rot)
      out.multiplyMatrices(base, local)
      mesh!.setMatrixAt(i, out)
    }

    for (let i = 0; i < n; i++) {
      const f = list[i]
      const moving = isMoving(f)
      const praying = f.state === 'pray'
      const working = f.state === 'build'
      const fast = f.burning > 0 || f.scared > 0
      const stride = t * (fast ? 16 : 9) + f.phase

      let lift = 0
      if (moving) lift = Math.abs(Math.sin(stride)) * 0.012
      if (f.jump > 0) lift += Math.sin((f.jump / 0.6) * Math.PI) * 0.25
      if (f.id === selected) lift += 0.03 + Math.sin(t * 6) * 0.015

      surfacePoint(f.dir, p, lift)
      const faced = facingQuaternion(f.dir, f.target, q) ?? surfaceQuaternion(f.dir, f.phase, q)
      obj.position.copy(p)
      obj.quaternion.copy(faced)
      obj.scale.setScalar(SCALE)
      if (praying) obj.scale.y = SCALE * 0.86
      obj.updateMatrix()
      const base = obj.matrix

      const legSwing = moving ? Math.sin(stride) * (fast ? 0.9 : 0.6) : 0
      let armL = -legSwing * 0.9
      let armR = legSwing * 0.9
      let spread = 0.08
      if (working) {
        const chop = Math.sin(t * 9 + f.phase)
        armL = -1.6 + chop * 0.7
        armR = -1.6 + chop * 0.7
        spread = 0.02
      } else if (praying) {
        armL = -2.6 + Math.sin(t * 2 + f.phase) * 0.1
        armR = armL
        spread = 0.25
      } else if (fast) {
        armL = -2.8
        armR = -2.6
        spread = 0.35
      }

      limb(refs.legL.current, i, base, -0.02, HIP, legSwing)
      limb(refs.legR.current, i, base, 0.02, HIP, -legSwing)
      limb(refs.armL.current, i, base, -0.048, SHOULDER, armL, -spread)
      limb(refs.armR.current, i, base, 0.048, SHOULDER, armR, spread)
      refs.torso.current!.setMatrixAt(i, base)
      refs.head.current!.setMatrixAt(i, base)
      refs.hair.current!.setMatrixAt(i, base)
      refs.hit.current!.setMatrixAt(i, base)
      refs.halo.current!.setMatrixAt(i, praying ? base : ZERO)

      if (f.job || f.id === selected) {
        local.makeRotationY(t * 2 + f.phase)
        out.multiplyMatrices(base, local)
        refs.marker.current!.setMatrixAt(i, out)
        refs.marker.current!.setColorAt(i, f.job ? JOB_COLORS[f.job.kind] : c.setRGB(2.2, 2.2, 2.2))
      } else {
        refs.marker.current!.setMatrixAt(i, ZERO)
      }

      if (f.burning > 0) {
        c.copy(FIRE).multiplyScalar(0.7 + Math.random() * 0.6)
      } else {
        c.copy(f.robe)
        if (f.happiness < 25) c.lerp(GLUM, 0.5)
        if (f.hp < 50) c.lerp(HURT, (50 - f.hp) / 100)
      }
      refs.torso.current!.setColorAt(i, c)
      refs.armL.current!.setColorAt(i, c)
      refs.armR.current!.setColorAt(i, c)
      const pants = f.burning > 0 ? c : tmp.c.copy(f.robe).multiplyScalar(0.45)
      refs.legL.current!.setColorAt(i, pants)
      refs.legR.current!.setColorAt(i, pants)
      refs.head.current!.setColorAt(i, f.burning > 0 ? FIRE : f.skin)
      refs.hair.current!.setColorAt(i, f.burning > 0 ? FIRE : HAIR_COLORS[f.id % HAIR_COLORS.length])
    }

    for (const r of Object.values(refs)) {
      const mesh = r.current
      if (!mesh) continue
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    refs.hit.current?.computeBoundingSphere()
  })

  const onGrab = (e: ThreeEvent<PointerEvent>) => {
    if (state.tool !== 'hand' || e.instanceId === undefined) return
    e.stopPropagation()
    pokeFollower(e.instanceId)
    beginTether(e.instanceId)
    if (controls) controls.enabled = false
  }

  const part = (ref: React.RefObject<InstancedMesh | null>, geo: THREE_GEO, roughness = 0.7) => (
    <instancedMesh ref={ref} args={[geo, undefined, MAX]} castShadow frustumCulled={false} raycast={() => null}>
      <meshStandardMaterial roughness={roughness} />
    </instancedMesh>
  )

  return (
    <group>
      {part(refs.legL, geos.leg)}
      {part(refs.legR, geos.leg)}
      {part(refs.torso, geos.torso)}
      {part(refs.armL, geos.arm)}
      {part(refs.armR, geos.arm)}
      {part(refs.head, geos.head, 0.6)}
      {part(refs.hair, geos.hair, 0.9)}
      <instancedMesh ref={refs.halo} args={[geos.halo, undefined, MAX]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color={[2.4, 1.9, 0.7]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={refs.marker} args={[geos.marker, undefined, MAX]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={refs.hit} args={[geos.hit, undefined, MAX]} frustumCulled={false} onPointerDown={onGrab}>
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

type THREE_GEO = CapsuleGeometry | SphereGeometry
