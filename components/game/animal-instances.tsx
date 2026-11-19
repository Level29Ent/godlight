'use client'

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, Object3D } from 'three'
import { ANIMAL_PARTS, MAX_ANIMAL_PARTS, poseAnimalPart, type AnimalKind } from '@/lib/game/animal-visuals'

export interface AnimalPainter {
  begin(): void
  draw(kind: AnimalKind, matrix: Matrix4, time: number, phase: number): void
  end(): void
}

/** All body parts share one geometry/material and one instanced draw call. */
export const AnimalInstances = forwardRef<AnimalPainter, { capacity: number }>(function AnimalInstances({ capacity }, ref) {
  const mesh = useRef<InstancedMesh>(null)
  const scratch = useMemo(() => ({ part: new Object3D(), matrix: new Matrix4(), color: new Color() }), [])
  useImperativeHandle(ref, () => {
    let count = 0
    return {
      begin() { count = 0 },
      draw(kind, matrix, time, phase) {
        if (!mesh.current) return
        for (const part of ANIMAL_PARTS[kind]) {
          scratch.matrix.multiplyMatrices(matrix, poseAnimalPart(part, time, phase, scratch.part))
          mesh.current.setMatrixAt(count, scratch.matrix)
          mesh.current.setColorAt(count, scratch.color.set(part.color))
          count++
        }
      },
      end() {
        if (!mesh.current) return
        mesh.current.count = count
        mesh.current.instanceMatrix.needsUpdate = true
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
      },
    }
  }, [scratch])
  return <instancedMesh ref={mesh} args={[undefined, undefined, capacity * MAX_ANIMAL_PARTS]} frustumCulled={false} raycast={() => null}>
    <icosahedronGeometry args={[1, 1]} />
    <meshStandardMaterial roughness={0.9} flatShading />
  </instancedMesh>
})
