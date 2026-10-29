'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  Vector3,
} from 'three'
import { isBuildable, PLANET_RADIUS, surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { state } from '@/lib/game/store'

const RING_RADIUS: Record<string, number> = {
  sun: 1.1,
  rain: 1.3,
  lightning: 0.4,
  meteor: 1.5,
  house: 0.3,
  farm: 0.3,
  temple: 0.42,
}

const RING_COLOR: Record<string, Color> = {
  sun: new Color(2.2, 1.7, 0.5),
  rain: new Color(0.5, 1.2, 2.2),
  lightning: new Color(1.6, 1.6, 2.6),
  meteor: new Color(2.6, 0.9, 0.3),
}
const OK = new Color(0.4, 2, 0.8)
const BAD = new Color(2.4, 0.4, 0.3)

function canBuildAt(dir: Vector3) {
  if (!isBuildable(dir)) return false
  const isTemple = state.tool === 'temple'
  return !state.buildings.some(
    (b) => b.dir.distanceTo(dir) * PLANET_RADIUS < (isTemple || b.type === 'temple' ? 0.8 : 0.55),
  )
}

export function CursorFX() {
  const anchor = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const sun = useRef<Group>(null)
  const sunLight = useRef<PointLight>(null)
  const rain = useRef<Group>(null)
  const preview = useRef<Mesh>(null)
  const vis = useRef({ sun: 0, rain: 0 })
  const warmFrames = useRef(0)
  const ringMat = useMemo(
    () => new MeshBasicMaterial({ transparent: true, depthTest: false, toneMapped: false, side: DoubleSide }),
    [],
  )
  const previewMat = useMemo(
    () => new MeshBasicMaterial({ transparent: true, opacity: 0.45, toneMapped: false, depthWrite: false }),
    [],
  )

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const { cursor, tool, started } = state
    const dir = cursor.dir
    const g = anchor.current
    if (!g) return
    if (warmFrames.current < 30) {
      // Draw the sun, rain cloud and preview hidden inside the planet for a few frames so
      // their shaders compile up front instead of stalling on the first use of each power.
      warmFrames.current++
      g.visible = true
      g.position.set(0, 0, 0)
      g.scale.setScalar(0.001)
      if (sun.current) sun.current.visible = true
      if (rain.current) rain.current.visible = true
      if (preview.current) preview.current.visible = true
      return
    }
    if (warmFrames.current === 30) {
      warmFrames.current++
      g.scale.setScalar(1)
    }
    const active = started && dir && tool !== 'hand'
    g.visible = !!active
    const v = vis.current
    v.sun += ((active && tool === 'sun' && cursor.down ? 1 : 0) - v.sun) * Math.min(1, dt * 8)
    v.rain += ((active && tool === 'rain' && cursor.down ? 1 : 0) - v.rain) * Math.min(1, dt * 8)
    if (!active || !dir) {
      if (sunLight.current) sunLight.current.intensity = 0
      return
    }

    surfacePoint(dir, g.position, 0.04)
    surfaceQuaternion(dir, 0, g.quaternion)

    const isBuild = tool === 'house' || tool === 'farm' || tool === 'temple'
    const valid = isBuild ? canBuildAt(dir) : true
    if (ring.current) {
      const r = RING_RADIUS[tool] ?? 0.5
      const pulse = 1 + Math.sin(t * 4) * 0.03
      ring.current.scale.setScalar(r * pulse)
      ringMat.color.copy(isBuild ? (valid ? OK : BAD) : RING_COLOR[tool])
      ringMat.opacity = cursor.down ? 0.9 : 0.55
      ring.current.rotation.z = t * 0.4
    }

    if (preview.current) {
      preview.current.visible = isBuild
      if (isBuild) {
        previewMat.color.copy(valid ? OK : BAD).multiplyScalar(0.5)
        const sc = tool === 'temple' ? [0.6, 0.35, 0.6] : tool === 'farm' ? [0.46, 0.05, 0.36] : [0.26, 0.3, 0.24]
        preview.current.scale.set(sc[0], sc[1], sc[2])
        preview.current.position.y = sc[1] / 2
      }
    }

    if (sun.current) {
      sun.current.visible = v.sun > 0.01
      sun.current.scale.setScalar(v.sun)
      sun.current.rotation.y = t * 0.5
    }
    if (sunLight.current) {
      sunLight.current.intensity = v.sun * 18
      surfacePoint(dir, sunLight.current.position, 1.6)
    }
    if (rain.current) {
      rain.current.visible = v.rain > 0.01
      rain.current.scale.setScalar(0.3 + v.rain * 0.7)
    }
  })

  return (
    <>
    <group ref={anchor} visible={false}>
      <mesh ref={ring} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10} raycast={() => null}>
        <ringGeometry args={[0.92, 1, 64, 1, 0, Math.PI * 1.85]} />
      </mesh>
      <mesh ref={preview} material={previewMat} raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      <group ref={sun} visible={false}>
        <mesh position={[0, 2.4, 0]} raycast={() => null}>
          <icosahedronGeometry args={[0.32, 3]} />
          <meshBasicMaterial color={[5, 3.6, 1.2]} toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.4, 0]} raycast={() => null}>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshBasicMaterial color={[1.6, 1, 0.3]} toneMapped={false} transparent opacity={0.25} blending={AdditiveBlending} wireframe />
        </mesh>
        <mesh position={[0, 1.2, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.25, 1.1, 2.4, 40, 1, true]} />
          <meshBasicMaterial
            color={[1.2, 0.9, 0.35]}
            transparent
            opacity={0.18}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group ref={rain} visible={false}>
        <RainCloud />
      </group>
    </group>
    {/* Kept outside the toggled groups: hiding a light changes the scene's light count,
        which recompiles every lit material and freezes the frame. */}
    <pointLight ref={sunLight} color="#ffcf7a" distance={5} decay={1.5} intensity={0} />
    </>
  )
}

const DROPS = 140

function RainCloud() {
  const drops = useRef<InstancedMesh>(null)
  const geo = useMemo(() => new BoxGeometry(0.01, 0.14, 0.01), [])
  const data = useMemo(
    () =>
      Array.from({ length: DROPS }, () => {
        const a = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * 1.15
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: Math.random() * 1.8, speed: 3 + Math.random() * 1.5 }
      }),
    [],
  )
  const obj = useMemo(() => new Object3D(), [])
  const puffs = useMemo(
    () => [
      [0, 0, 0, 0.42],
      [0.42, -0.05, 0.1, 0.32],
      [-0.4, -0.04, -0.05, 0.34],
      [0.12, 0.12, -0.3, 0.3],
      [-0.15, 0.05, 0.32, 0.3],
      [0.6, -0.1, -0.25, 0.22],
      [-0.6, -0.08, 0.25, 0.22],
    ],
    [],
  )

  useFrame((_, dt) => {
    const m = drops.current
    if (!m) return
    for (let i = 0; i < DROPS; i++) {
      const d = data[i]
      d.y -= d.speed * dt
      if (d.y < 0) d.y = 1.8
      obj.position.set(d.x, d.y, d.z)
      obj.updateMatrix()
      m.setMatrixAt(i, obj.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <group position={[0, 1.95, 0]}>
        {puffs.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow raycast={() => null}>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color="#b9c3d1" roughness={1} flatShading />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={drops} args={[geo, undefined, DROPS]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color="#a8d8ff" transparent opacity={0.7} />
      </instancedMesh>
    </group>
  )
}
