'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DodecahedronGeometry, InstancedMesh, Matrix4, Object3D } from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { state } from '@/lib/game/store'

const MAX_ROCKS = 140
const ZERO = new Matrix4().makeScale(0, 0, 0)
const SHADES = ['#8a8f99', '#9aa0a8', '#7b7f88', '#a6a29a']

export function Rocks() {
  const big = useRef<InstancedMesh>(null)
  const small = useRef<InstancedMesh>(null)

  const geos = useMemo(() => {
    const b = new DodecahedronGeometry(0.09, 0)
    b.scale(1.15, 0.75, 1)
    b.translate(0, 0.03, 0)
    const s = new DodecahedronGeometry(0.05, 0)
    s.scale(1, 0.7, 1.2)
    s.translate(0.08, 0.012, 0.03)
    return { b, s }
  }, [])

  const obj = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const c = new Color()
    for (let i = 0; i < MAX_ROCKS; i++) {
      c.set(SHADES[i % SHADES.length])
      big.current?.setColorAt(i, c)
      c.offsetHSL(0, 0, -0.06)
      small.current?.setColorAt(i, c)
    }
  }, [])

  useFrame(() => {
    const list = state.rocks
    const n = Math.min(list.length, MAX_ROCKS)
    for (let i = 0; i < n; i++) {
      const rock = list[i]
      surfacePoint(rock.dir, obj.position, -0.01)
      surfaceQuaternion(rock.dir, rock.yaw, obj.quaternion)
      const s = Math.max(0.2, rock.size) * 1.2
      obj.scale.setScalar(s)
      obj.updateMatrix()
      big.current!.setMatrixAt(i, obj.matrix)
      if (rock.size > 0.5) small.current!.setMatrixAt(i, obj.matrix)
      else small.current!.setMatrixAt(i, ZERO)
    }
    for (let i = n; i < MAX_ROCKS; i++) {
      big.current!.setMatrixAt(i, ZERO)
      small.current!.setMatrixAt(i, ZERO)
    }
    big.current!.count = MAX_ROCKS
    small.current!.count = MAX_ROCKS
    big.current!.instanceMatrix.needsUpdate = true
    small.current!.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={big} args={[geos.b, undefined, MAX_ROCKS]} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial flatShading roughness={0.95} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={small} args={[geos.s, undefined, MAX_ROCKS]} castShadow frustumCulled={false}>
        <meshStandardMaterial flatShading roughness={0.95} metalness={0.05} />
      </instancedMesh>
    </group>
  )
}
