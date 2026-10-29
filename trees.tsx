'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, ConeGeometry, CylinderGeometry, IcosahedronGeometry, InstancedMesh, Matrix4, Object3D, Vector3 } from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { state } from '@/lib/game/store'

const MAX_TREES = 200
const MAX_FLAMES = 260
const ZERO = new Matrix4().makeScale(0, 0, 0)
const CHAR = new Color('#2b2522')
const FIRE = new Color(3.2, 1.2, 0.3)
const PINE = ['#2f7d4a', '#3a8c4f', '#276b42']
const ROUND = ['#6bb34a', '#7fc451', '#5aa143', '#9acb4f']

export function Trees() {
  const trunk = useRef<InstancedMesh>(null)
  const pine = useRef<InstancedMesh>(null)
  const round = useRef<InstancedMesh>(null)

  const geos = useMemo(() => {
    const t = new CylinderGeometry(0.022, 0.034, 0.16, 6)
    t.translate(0, 0.08, 0)
    const p = new ConeGeometry(0.12, 0.36, 7)
    p.translate(0, 0.3, 0)
    const r = new IcosahedronGeometry(0.13, 0)
    r.translate(0, 0.27, 0)
    return { t, p, r }
  }, [])

  const tmp = useMemo(() => ({ obj: new Object3D(), c: new Color() }), [])

  useLayoutEffect(() => {
    const w = new Color('#ffffff')
    for (let i = 0; i < MAX_TREES; i++) {
      pine.current?.setColorAt(i, w)
      round.current?.setColorAt(i, w)
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const list = state.trees
    const n = Math.min(list.length, MAX_TREES)
    const { obj, c } = tmp
    for (let i = 0; i < n; i++) {
      const tree = list[i]
      surfacePoint(tree.dir, obj.position, -0.02)
      surfaceQuaternion(tree.dir, tree.yaw, obj.quaternion)
      const sway = tree.burning > 0 ? 1 + Math.sin(t * 20 + i) * 0.05 : 1
      const s = Math.max(0.05, tree.size) * (tree.charred > 0 ? 0.85 : 1) * 1.1
      obj.scale.set(s * sway, s, s * sway)
      obj.updateMatrix()
      trunk.current!.setMatrixAt(i, obj.matrix)
      const foliage = tree.kind === 0 ? pine.current! : round.current!
      const other = tree.kind === 0 ? round.current! : pine.current!
      foliage.setMatrixAt(i, obj.matrix)
      other.setMatrixAt(i, ZERO)

      if (tree.charred > 0) c.copy(CHAR)
      else {
        c.set((tree.kind === 0 ? PINE : ROUND)[tree.id % (tree.kind === 0 ? PINE.length : ROUND.length)])
        if (tree.burning > 0) c.lerp(FIRE, Math.min(1, tree.burning / 2) * (0.7 + Math.random() * 0.3))
        else if (tree.heat > 1) c.lerp(SCORCH, Math.min(0.6, tree.heat / 10))
      }
      foliage.setColorAt(i, c)
    }
    for (const m of [trunk.current, pine.current, round.current]) {
      if (!m) continue
      m.count = n
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={trunk} args={[geos.t, undefined, MAX_TREES]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial color="#7a5434" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={pine} args={[geos.p, undefined, MAX_TREES]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={round} args={[geos.r, undefined, MAX_TREES]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <Flames />
    </group>
  )
}

const SCORCH = new Color('#b5a03a')

function Flames() {
  const mesh = useRef<InstancedMesh>(null)
  const geo = useMemo(() => {
    const g = new ConeGeometry(0.06, 0.22, 6)
    g.translate(0, 0.11, 0)
    return g
  }, [])
  const tmp = useMemo(() => ({ obj: new Object3D(), off: new Vector3(), c: new Color() }), [])

  useLayoutEffect(() => {
    for (let i = 0; i < MAX_FLAMES; i++) mesh.current?.setColorAt(i, FIRE)
  }, [])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    const t = clock.elapsedTime
    const { obj, c } = tmp
    let n = 0
    const place = (dir: Vector3, lift: number, scale: number, seed: number, count: number, spread: number) => {
      for (let k = 0; k < count && n < MAX_FLAMES; k++) {
        const a = seed * 1.7 + k * 2.4
        surfacePoint(dir, obj.position, lift)
        surfaceQuaternion(dir, a, obj.quaternion)
        obj.translateX(Math.cos(a) * spread)
        obj.translateZ(Math.sin(a) * spread)
        const flicker = 0.7 + Math.sin(t * 18 + seed + k * 3) * 0.2 + Math.random() * 0.2
        obj.scale.set(scale * (0.8 + flicker * 0.3), scale * flicker * 1.4, scale * (0.8 + flicker * 0.3))
        obj.updateMatrix()
        m.setMatrixAt(n, obj.matrix)
        c.setRGB(3.2, 0.9 + flicker * 0.9, 0.2)
        m.setColorAt(n, c)
        n++
      }
    }
    for (const tree of state.trees) if (tree.burning > 0) place(tree.dir, 0.12 * tree.size, Math.max(0.5, tree.size) * 1.1, tree.id, 2, 0.04)
    for (const b of state.buildings) if (b.burning > 0) place(b.dir, 0.05, b.type === 'temple' ? 1.5 : 1.2, b.id, 4, 0.11)
    for (const f of state.followers) if (f.burning > 0) place(f.dir, 0.15, 0.7, f.id, 1, 0)
    m.count = n
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, MAX_FLAMES]} frustumCulled={false} raycast={() => null}>
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
    </instancedMesh>
  )
}
