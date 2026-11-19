'use client'

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, Object3D } from 'three'
import { inspectEntity, isPaused, state } from '@/lib/game/store'
import { claimPointer } from '@/lib/game/camera'
import { ANIMAL_PARTS, MAX_ANIMAL_PARTS, poseAnimalPart, type AnimalKind } from '@/lib/game/animal-visuals'

export interface AnimalPainter {
  begin(): void
  draw(kind: AnimalKind, matrix: Matrix4, time: number, phase: number, id: number, grazing?: number, rare?: boolean, flight?: number): void
  end(): void
}

/** Detailed parts share one draw call; one generous pick volume per animal keeps touch cheap. */
export const AnimalInstances = forwardRef<AnimalPainter, { capacity: number }>(function AnimalInstances({ capacity }, ref) {
  const mesh = useRef<InstancedMesh>(null), targets = useRef<InstancedMesh>(null)
  const ids = useRef<number[]>([])
  const scratch = useMemo(() => ({ part: new Object3D(), matrix: new Matrix4(), color: new Color() }), [])
  useImperativeHandle(ref, () => {
    let count = 0, animals = 0
    return {
      begin() { count = 0; animals = 0 },
      draw(kind, matrix, time, phase, id, grazing = 0, rare = false, flight = 1) {
        if (!mesh.current || !targets.current) return
        for (const part of ANIMAL_PARTS[kind]) {
          if (part.rareOnly && !rare) continue
          scratch.matrix.multiplyMatrices(matrix, poseAnimalPart(part, time, phase, scratch.part, grazing, flight))
          mesh.current.setMatrixAt(count, scratch.matrix)
          scratch.color.set(rare && kind === 'deer' && !['#352c2a', '#211f27', '#443632'].includes(part.color) ? '#f5edda' : part.color)
          if (rare && kind === 'fish') scratch.color.set('#a2ffe4').multiplyScalar(2.4)
          mesh.current.setColorAt(count++, scratch.color)
        }
        scratch.part.position.set(0, kind === 'deer' ? 0.28 : 0.03, 0)
        scratch.part.rotation.set(0, 0, 0)
        scratch.part.scale.set(kind === 'bird' ? 0.33 : 0.16, kind === 'deer' ? 0.3 : 0.12, 0.33)
        scratch.part.updateMatrix()
        scratch.matrix.multiplyMatrices(matrix, scratch.part.matrix)
        targets.current.setMatrixAt(animals, scratch.matrix)
        ids.current[animals++] = id
      },
      end() {
        if (!mesh.current || !targets.current) return
        mesh.current.count = count; targets.current.count = animals
        targets.current.boundingSphere = null
        mesh.current.instanceMatrix.needsUpdate = targets.current.instanceMatrix.needsUpdate = true
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
      },
    }
  }, [scratch])
  return <>
    <instancedMesh ref={mesh} args={[undefined, undefined, capacity * MAX_ANIMAL_PARTS]} frustumCulled={false} raycast={() => null}>
      <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
    <instancedMesh ref={targets} args={[undefined, undefined, capacity]} frustumCulled={false} raycast={(raycaster, hits) => {
      if (targets.current && state.started && !state.photoMode && !state.gameOver && !isPaused()) InstancedMesh.prototype.raycast.call(targets.current, raycaster, hits)
    }} onPointerDown={e => {
      if (e.point.dot(e.camera.position) <= e.point.lengthSq() || isPaused() || e.instanceId === undefined || e.nativeEvent.button !== 0) return
      const id = ids.current[e.instanceId]
      if (id === undefined) return
      e.stopPropagation(); claimPointer(); inspectEntity({ kind: 'animal', id })
    }}>
      <sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
    </instancedMesh>
  </>
})
