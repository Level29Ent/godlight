'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { state } from '@/lib/game/store'
import { wildlifeHabitat } from '@/lib/game/wildlife'
import { isLand, surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'

// At most 18 procedural animals. Positions use simulation time, so pauses freeze movement.
export function WildlifeScene() {
  const legs = useRef<InstancedMesh>(null)
  const deer = useRef<InstancedMesh>(null), heads = useRef<InstancedMesh>(null), birds = useRef<InstancedMesh>(null), wings = useRef<InstancedMesh>(null)
  const tmp = useMemo(() => ({ obj: new Object3D(), dir: new Vector3(), tangent: new Vector3(), q: new Quaternion(), local: new Matrix4(), out: new Matrix4() }), [])
  useFrame(() => {
    const h = wildlifeHabitat(state), n = h.forest.length ? Math.floor(state.wildlife.deer) : 0, m = h.water.length ? Math.floor(state.wildlife.birds) : 0
    if (!legs.current || !deer.current || !heads.current || !birds.current || !wings.current) return
    const { obj, dir, tangent, q, local, out } = tmp
    deer.current.count = heads.current.count = n
    legs.current.count = n * 4
    birds.current.count = wings.current.count = m
    for (let i = 0; i < n; i++) {
      const home = h.forest[i % h.forest.length].dir, t = state.time * 0.35 + i * 2.399
      tangent.set(Math.sin(t), Math.cos(t * 0.7), Math.cos(t)).addScaledVector(home, -home.dot(tangent)).normalize()
      dir.copy(home).addScaledVector(tangent, 0.035).normalize()
      if (!isLand(dir)) dir.copy(home)
      surfacePoint(dir, obj.position, 0.18)
      obj.quaternion.copy(surfaceQuaternion(dir, t, q)); obj.scale.set(0.2, 0.13, 0.34); obj.updateMatrix()
      deer.current.setMatrixAt(i, obj.matrix)
      obj.scale.setScalar(1); obj.updateMatrix()
      for (let j = 0; j < 4; j++) {
        local.makeTranslation(j % 2 ? 0.07 : -0.07, -0.09, j < 2 ? -0.11 : 0.11)
        out.multiplyMatrices(obj.matrix, local)
        local.makeScale(0.025, 0.14, 0.025); out.multiply(local)
        legs.current.setMatrixAt(i * 4 + j, out)
      }
      obj.scale.set(0.09, 0.14, 0.11); surfacePoint(dir, obj.position, 0.34); obj.updateMatrix()
      heads.current.setMatrixAt(i, obj.matrix)
    }
    for (let i = 0; i < m; i++) {
      const home = h.water[i % h.water.length].dir, t = state.time * 0.6 + i * 2.399
      tangent.set(Math.sin(t), 0.4, Math.cos(t)).addScaledVector(home, -home.dot(tangent)).normalize()
      dir.copy(home).addScaledVector(tangent, 0.07).normalize()
      surfacePoint(dir, obj.position, 0.7 + (i % 3) * 0.12)
      obj.quaternion.copy(surfaceQuaternion(dir, t, q)); obj.scale.set(0.06, 0.05, 0.14); obj.updateMatrix()
      birds.current.setMatrixAt(i, obj.matrix)
      // A separate broad wing silhouette reads clearly without texture downloads.
      obj.scale.set(0.26, 0.018, 0.08); obj.updateMatrix()
      local.makeRotationZ(Math.sin(state.time * 5 + i) * 0.25)
      out.multiplyMatrices(obj.matrix, local); wings.current.setMatrixAt(i, out)
    }
    for (const mesh of [deer.current, legs.current, heads.current, birds.current, wings.current]) mesh.instanceMatrix.needsUpdate = true
  })
  return <group>
    <instancedMesh ref={legs} args={[undefined, undefined, 32]} frustumCulled={false} raycast={() => null}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#765238" roughness={1} /></instancedMesh>
    <instancedMesh ref={deer} args={[undefined, undefined, 8]} frustumCulled={false} raycast={() => null}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#b88756" roughness={1} /></instancedMesh>
    <instancedMesh ref={heads} args={[undefined, undefined, 8]} frustumCulled={false} raycast={() => null}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#d1a16a" roughness={1} /></instancedMesh>
    <instancedMesh ref={birds} args={[undefined, undefined, 10]} frustumCulled={false} raycast={() => null}><sphereGeometry args={[1, 6, 4]} /><meshStandardMaterial color="#eef3ef" roughness={0.8} /></instancedMesh>
    <instancedMesh ref={wings} args={[undefined, undefined, 10]} frustumCulled={false} raycast={() => null}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#8fbeca" roughness={0.8} /></instancedMesh>
  </group>
}
