'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { maxHp, state, useGame, type Building } from '@/lib/game/store'

export function Buildings() {
  const buildings = useGame((s) => s.buildings)
  return (
    <group>
      {buildings.map((b) => (
        <BuildingMesh key={b.id} b={b} />
      ))}
    </group>
  )
}

const CHARCOAL = new Color('#2d2826')

function BuildingMesh({ b }: { b: Building }) {
  const inner = useRef<Group>(null)
  const scaffold = useRef<Group>(null)
  const { position, quaternion } = useMemo(
    () => ({
      position: surfacePoint(b.dir, new Vector3(), -0.03),
      quaternion: surfaceQuaternion(b.dir, b.yaw, new Quaternion()),
    }),
    [b],
  )
  const wallMat = useMemo(
    () => new MeshStandardMaterial({ color: b.type === 'temple' ? '#efe8da' : '#f3e4c4', roughness: 0.85, flatShading: true }),
    [b.type],
  )
  const baseWall = useMemo(() => wallMat.color.clone(), [wallMat])
  const fullHp = maxHp(b.type)

  useFrame(() => {
    if (inner.current) {
      const p = b.progress
      inner.current.scale.set(1, 0.08 + 0.92 * p, 1)
    }
    if (scaffold.current) scaffold.current.visible = b.progress < 1
    wallMat.color.copy(baseWall).lerp(CHARCOAL, 1 - Math.max(0, b.hp) / fullHp)
  })

  return (
    <group position={position} quaternion={quaternion}>
      <group ref={inner}>
        {b.type === 'house' && <House wall={wallMat} />}
        {b.type === 'temple' && <Temple wall={wallMat} b={b} />}
        {b.type === 'well' && <Well />}
      </group>
      {b.type === 'farm' && <Farm b={b} />}
      <group ref={scaffold}>
        <Scaffold size={b.type === 'temple' ? 0.32 : b.type === 'farm' ? 0.22 : 0.14} height={b.type === 'farm' ? 0.06 : 0.3} />
      </group>
    </group>
  )
}

function Well() {
  const water = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (water.current) (water.current.material as MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 2.5) * 0.3
  })
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.12, 12]} />
        <meshStandardMaterial color="#9c948a" roughness={0.95} flatShading />
      </mesh>
      <mesh ref={water} position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.105, 16]} />
        <meshStandardMaterial color="#3fa7d6" emissive="#2a8fd0" emissiveIntensity={0.9} roughness={0.15} />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.025, 0.2, 0.025]} />
          <meshStandardMaterial color="#6b4228" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.17, 0.1, 4]} />
        <meshStandardMaterial color="#c4553a" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
        <meshStandardMaterial color="#4a3426" />
      </mesh>
    </group>
  )
}

function House({ wall }: { wall: MeshStandardMaterial }) {
  return (
    <group scale={1.15}>
      <mesh position={[0, 0.08, 0]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.16, 0.2]} />
      </mesh>
      <mesh position={[0, 0.215, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.185, 0.13, 4]} />
        <meshStandardMaterial color="#c4553a" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.06, 0.25, 0.03]} castShadow>
        <boxGeometry args={[0.03, 0.08, 0.03]} />
        <meshStandardMaterial color="#8a7b70" flatShading />
      </mesh>
      <mesh position={[0, 0.045, 0.101]}>
        <boxGeometry args={[0.05, 0.09, 0.005]} />
        <meshStandardMaterial color="#6b4228" />
      </mesh>
      <mesh position={[-0.112, 0.1, 0.02]}>
        <boxGeometry args={[0.005, 0.04, 0.05]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

function Temple({ wall, b }: { wall: MeshStandardMaterial; b: Building }) {
  const beam = useRef<Mesh>(null)
  const columns = useMemo(() => {
    const out: [number, number][] = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      out.push([Math.cos(a) * 0.19, Math.sin(a) * 0.19])
    }
    return out
  }, [])

  useFrame(({ clock }) => {
    if (!beam.current) return
    const praying = state.followers.filter((f) => f.atTemple && f.state === 'pray').length
    const target = b.progress >= 1 ? Math.min(1, 0.15 + praying * 0.2) : 0
    const mat = beam.current.material as { opacity: number }
    mat.opacity += (target * (0.22 + Math.sin(clock.elapsedTime * 2) * 0.04) - mat.opacity) * 0.05
  })

  return (
    <group>
      <mesh position={[0, 0.03, 0]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.06, 0.62]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.05, 0.52]} />
      </mesh>
      {columns.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} material={wall} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.2, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.315, 0]} material={wall} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 8]} />
      </mesh>
      <mesh position={[0, 0.335, 0]} castShadow>
        <sphereGeometry args={[0.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e9b949" metalness={0.85} roughness={0.25} emissive="#a86b12" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshBasicMaterial color={[3, 2.4, 1]} toneMapped={false} />
      </mesh>
      <mesh ref={beam} position={[0, 1.6, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.05, 0.16, 2.6, 20, 1, true]} />
        <meshBasicMaterial color={[1.8, 1.4, 0.6]} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

const CROP_GREEN = new Color('#5fae3c')
const CROP_GOLD = new Color('#f0c24b')
const SOIL_DRY = new Color('#a87a4c')
const SOIL_WET = new Color('#5b3d24')

function Farm({ b }: { b: Building }) {
  const crops = useRef<Group>(null)
  const cropMat = useMemo(() => new MeshStandardMaterial({ color: CROP_GREEN.clone(), roughness: 0.8, flatShading: true }), [])
  const soilMat = useMemo(() => new MeshStandardMaterial({ color: SOIL_DRY.clone(), roughness: 1 }), [])
  const rows = useMemo(() => {
    const out: [number, number][] = []
    for (let x = 0; x < 4; x++) for (let z = 0; z < 3; z++) out.push([-0.15 + x * 0.1, -0.1 + z * 0.1])
    return out
  }, [])

  useFrame(() => {
    const built = b.progress >= 1
    if (crops.current) {
      const s = built ? 0.25 + b.growth * 0.95 : 0.001
      crops.current.scale.set(1, s, 1)
    }
    cropMat.color.copy(CROP_GREEN).lerp(CROP_GOLD, Math.max(0, b.growth - 0.4) / 0.6)
    soilMat.color.copy(SOIL_DRY).lerp(SOIL_WET, b.moisture)
  })

  return (
    <group>
      <mesh position={[0, 0.03, 0]} material={soilMat} receiveShadow castShadow>
        <boxGeometry args={[0.46, 0.04, 0.36]} />
      </mesh>
      <group ref={crops} position={[0, 0.05, 0]}>
        {rows.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.06, z]} material={cropMat} castShadow>
            <coneGeometry args={[0.03, 0.12, 5]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Scaffold({ size, height }: { size: number; height: number }) {
  const corners: [number, number][] = [
    [-size, -size],
    [size, -size],
    [size, size],
    [-size, size],
  ]
  return (
    <group>
      {corners.map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow>
          <boxGeometry args={[0.014, height, 0.014]} />
          <meshStandardMaterial color="#b0814e" />
        </mesh>
      ))}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[size * 2 + 0.02, 0.012, size * 2 + 0.02]} />
        <meshStandardMaterial color="#b0814e" wireframe />
      </mesh>
    </group>
  )
}
