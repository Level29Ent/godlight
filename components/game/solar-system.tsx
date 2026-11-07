'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Group, PerspectiveCamera } from 'three'

// A stylized, camera-relative panorama: no textures, extra lights, shadows or hit targets.
const BODIES = [
  { name: 'Mercury', x: -28, y: 34, z: -100, radius: 0.45, color: '#b7aaa2' },
  { name: 'Venus', x: -21, y: 36, z: -105, radius: 0.8, color: '#edc686' },
  { name: 'Earth', x: -12, y: 37, z: -110, radius: 1, color: '#57a9cf' },
  { name: 'Mars', x: 0, y: 39, z: -115, radius: 0.65, color: '#d17c59' },
  { name: 'Jupiter', x: 16, y: 39, z: -120, radius: 2.9, color: '#d4b499' },
  { name: 'Saturn', x: 35, y: 35, z: -125, radius: 2.2, color: '#e2c99a' },
  { name: 'Uranus', x: 45, y: 31, z: -130, radius: 1.4, color: '#9ddcdf' },
  { name: 'Neptune', x: -43, y: -35, z: -130, radius: 1.35, color: '#4a76d5' },
]

export function SolarSystem() {
  const root = useRef<Group>(null)
  useFrame(({ camera, clock }) => {
    if (!root.current) return
    root.current.position.copy(camera.position)
    root.current.quaternion.copy(camera.quaternion)
    const aspect = camera instanceof PerspectiveCamera ? camera.aspect : 1.6
    const width = Math.min(1, aspect / 1.6)
    root.current.children.forEach((body, i) => {
      body.position.x = (i === 0 ? -39 : BODIES[i - 1].x) * width
      body.rotation.y = clock.elapsedTime * 0.025 * (i + 1)
    })
  })
  return (
    <group ref={root}>
      <mesh position={[-39, 32, -110]} raycast={() => null}>
        <sphereGeometry args={[4, 24, 16]} />
        <meshBasicMaterial color={[2.5, 1.5, 0.4]} toneMapped={false} fog={false} />
      </mesh>
      {BODIES.map(body => (
        <group key={body.name} name={body.name} position={[body.x, body.y, body.z]}>
          <mesh raycast={() => null}>
            <sphereGeometry args={[body.radius, 20, 12]} />
            <meshBasicMaterial color={body.color} fog={false} />
          </mesh>
          {body.name === 'Saturn' && (
            <mesh rotation={[1.15, 0.2, 0.35]} raycast={() => null}>
              <ringGeometry args={[3, 4.5, 48]} />
              <meshBasicMaterial color="#bfa784" side={DoubleSide} fog={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}
