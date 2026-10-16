'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Group, InstancedMesh, MeshBasicMaterial, Object3D, Quaternion, Vector3 } from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { state } from '@/lib/game/store'
import { JOB_COLORS } from './followers'

const BEADS = 28
const BLOCKED = new Color(2.4, 0.4, 0.35)
const NEUTRAL = new Color(2.2, 2, 1.4)

export function Tether() {
  const beads = useRef<InstancedMesh>(null)
  const ring = useRef<Group>(null)
  const ringMat = useRef<MeshBasicMaterial>(null)
  const tmp = useMemo(
    () => ({ a: new Vector3(), b: new Vector3(), mid: new Vector3(), p: new Vector3(), obj: new Object3D(), q: new Quaternion(), c: new Color() }),
    [],
  )

  useFrame(({ clock }) => {
    const m = beads.current
    if (!m || !ring.current) return
    const t = clock.elapsedTime
    const tether = state.tether
    const f = tether.followerId !== null ? state.followers.find((x) => x.id === tether.followerId) : null
    const cursor = state.cursor.dir
    if (!f || !cursor) {
      m.count = 0
      ring.current.visible = false
      return
    }
    const { a, b, mid, p, obj, q, c } = tmp
    surfacePoint(f.dir, a, 0.45)
    surfacePoint(cursor, b, 0.05)
    const span = a.distanceTo(b)
    mid.addVectors(f.dir, cursor).normalize()
    surfacePoint(mid, mid, 0.35 + span * 0.25)

    const preview = tether.preview
    if (!preview) c.copy(NEUTRAL)
    else if (preview.kind === null) c.copy(BLOCKED)
    else c.copy(JOB_COLORS[preview.kind])

    for (let i = 0; i < BEADS; i++) {
      const k = i / (BEADS - 1)
      const u = 1 - k
      p.set(0, 0, 0)
        .addScaledVector(a, u * u)
        .addScaledVector(mid, 2 * u * k)
        .addScaledVector(b, k * k)
      obj.position.copy(p)
      const pulse = 0.6 + 0.4 * Math.sin(t * 10 - k * 12)
      obj.scale.setScalar((0.028 + pulse * 0.022) * (1 - k * 0.3))
      obj.updateMatrix()
      m.setMatrixAt(i, obj.matrix)
      m.setColorAt(i, c)
    }
    m.count = BEADS
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true

    ring.current.visible = true
    surfacePoint(cursor, ring.current.position, 0.04)
    surfaceQuaternion(cursor, t, q)
    ring.current.quaternion.copy(q)
    ring.current.scale.setScalar(1 + Math.sin(t * 6) * 0.08)
    ringMat.current?.color.copy(c)
  })

  return (
    <group>
      <instancedMesh ref={beads} args={[undefined, undefined, BEADS]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial toneMapped={false} blending={AdditiveBlending} transparent depthWrite={false} />
      </instancedMesh>
      <group ref={ring} visible={false}>
        <mesh raycast={() => null} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.02, 6, 32]} />
          <meshBasicMaterial ref={ringMat} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
