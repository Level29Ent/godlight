'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { CapsuleGeometry, Color, InstancedMesh, Matrix4, Object3D, Quaternion, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { facingQuaternion, surfaceQuaternion } from '@/lib/game/orient'
import { pokeFollower, state } from '@/lib/game/store'

const MAX = 160
const FIRE = new Color(3, 1.1, 0.25)
const ZERO = new Matrix4().makeScale(0, 0, 0)

export function Followers() {
  const body = useRef<InstancedMesh>(null)
  const head = useRef<InstancedMesh>(null)
  const halo = useRef<InstancedMesh>(null)
  const hit = useRef<InstancedMesh>(null)

  const geos = useMemo(() => {
    const b = new CapsuleGeometry(0.055, 0.1, 4, 10)
    b.translate(0, 0.105, 0)
    const h = new SphereGeometry(0.05, 14, 10)
    h.translate(0, 0.255, 0)
    const ha = new TorusGeometry(0.045, 0.009, 6, 24)
    ha.rotateX(Math.PI / 2)
    ha.translate(0, 0.34, 0)
    const hi = new SphereGeometry(0.2, 8, 6)
    hi.translate(0, 0.15, 0)
    return { b, h, ha, hi }
  }, [])

  const tmp = useMemo(
    () => ({ obj: new Object3D(), q: new Quaternion(), p: new Vector3(), c: new Color() }),
    [],
  )

  useLayoutEffect(() => {
    const white = new Color('#ffffff')
    for (let i = 0; i < MAX; i++) {
      body.current?.setColorAt(i, white)
      head.current?.setColorAt(i, white)
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const list = state.followers
    const n = Math.min(list.length, MAX)
    const { obj, q, p, c } = tmp

    for (let i = 0; i < n; i++) {
      const f = list[i]
      const walking = f.state === 'wander' || f.state === 'build' || f.state === 'pilgrim' || f.state === 'flee' || f.burning > 0
      const praying = f.state === 'pray'
      let lift = 0
      if (walking) lift = Math.abs(Math.sin(t * (f.burning > 0 || f.scared > 0 ? 22 : 12) + f.phase)) * 0.025
      if (f.jump > 0) lift += Math.sin((f.jump / 0.6) * Math.PI) * 0.25

      surfacePoint(f.dir, p, lift)
      const faced = facingQuaternion(f.dir, f.target, q) ?? surfaceQuaternion(f.dir, f.phase, q)
      obj.position.copy(p)
      obj.quaternion.copy(faced)
      const s = 1.8
      obj.scale.set(s, praying ? s * (0.78 + Math.sin(t * 3 + f.phase) * 0.06) : s, s)
      if (f.state === 'build' && !walking) obj.scale.y = s * (0.9 + Math.abs(Math.sin(t * 10 + f.phase)) * 0.1)
      obj.updateMatrix()

      body.current!.setMatrixAt(i, obj.matrix)
      head.current!.setMatrixAt(i, obj.matrix)
      hit.current!.setMatrixAt(i, obj.matrix)
      halo.current!.setMatrixAt(i, praying ? obj.matrix : ZERO)

      if (f.burning > 0) {
        const flicker = 0.7 + Math.random() * 0.6
        c.copy(FIRE).multiplyScalar(flicker)
      } else {
        c.copy(f.robe)
        if (f.happiness < 25) c.lerp(GLUM, 0.5)
      }
      body.current!.setColorAt(i, c)
      head.current!.setColorAt(i, f.burning > 0 ? c : f.skin)
    }

    for (const mesh of [body.current, head.current, halo.current, hit.current]) {
      if (!mesh) continue
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    hit.current?.computeBoundingSphere()
  })

  const onPoke = (e: ThreeEvent<PointerEvent>) => {
    if (state.tool !== 'hand' || e.instanceId === undefined) return
    e.stopPropagation()
    pokeFollower(e.instanceId)
  }

  return (
    <group>
      <instancedMesh ref={body} args={[geos.b, undefined, MAX]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={head} args={[geos.h, undefined, MAX]} castShadow frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[geos.ha, undefined, MAX]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color={[2.4, 1.9, 0.7]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={hit} args={[geos.hi, undefined, MAX]} frustumCulled={false} onPointerDown={onPoke}>
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

const GLUM = new Color('#6b6f7a')
