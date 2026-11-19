'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Quaternion, Vector3 } from 'three'
import { state } from '@/lib/game/store'
import { wildlifeHabitat } from '@/lib/game/wildlife'
import { isLand, surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { AnimalInstances, type AnimalPainter } from './animal-instances'

// At most 18 procedural animals. Positions use simulation time, so pauses freeze movement.
export function WildlifeScene() {
  const animals = useRef<AnimalPainter>(null)
  const tmp = useMemo(() => ({ obj: new Object3D(), dir: new Vector3(), tangent: new Vector3(), q: new Quaternion() }), [])
  useFrame(() => {
    const h = wildlifeHabitat(state), n = h.forest.length ? Math.floor(state.wildlife.deer) : 0, m = h.water.length ? Math.floor(state.wildlife.birds) : 0
    if (!animals.current) return
    const { obj, dir, tangent, q } = tmp
    animals.current.begin()
    for (let i = 0; i < n; i++) {
      const home = h.forest[i % h.forest.length].dir, t = state.time * 0.35 + i * 2.399
      tangent.set(Math.sin(t), Math.cos(t * 0.7), Math.cos(t)).addScaledVector(home, -home.dot(tangent)).normalize()
      dir.copy(home).addScaledVector(tangent, 0.035).normalize()
      if (!isLand(dir)) dir.copy(home)
      surfacePoint(dir, obj.position, 0.015)
      obj.quaternion.copy(surfaceQuaternion(dir, t, q)); obj.scale.setScalar(1); obj.updateMatrix()
      animals.current.draw('deer', obj.matrix, state.time, i * 2.399)
    }
    for (let i = 0; i < m; i++) {
      const home = h.water[i % h.water.length].dir, t = state.time * 0.6 + i * 2.399
      tangent.set(Math.sin(t), 0.4, Math.cos(t)).addScaledVector(home, -home.dot(tangent)).normalize()
      dir.copy(home).addScaledVector(tangent, 0.07).normalize()
      surfacePoint(dir, obj.position, 0.7 + (i % 3) * 0.12)
      obj.quaternion.copy(surfaceQuaternion(dir, t, q)); obj.scale.setScalar(0.85); obj.updateMatrix()
      animals.current.draw('bird', obj.matrix, state.time, i * 2.399)
    }
    animals.current.end()
  })
  return <AnimalInstances ref={animals} capacity={18} />
}
