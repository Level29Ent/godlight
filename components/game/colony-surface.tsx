'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Group } from 'three'
import { state, useGameVersion } from '@/lib/game/store'
import { DESTINATIONS } from '@/lib/game/cosmos'

export function ColonySurface({ index }: { index: number }) {
  useGameVersion()
  const camera = useThree(s => s.camera)
  useEffect(() => {
    const previous = camera.position.clone()
    camera.position.set(0, 7, 13); camera.lookAt(0, 0, 0)
    return () => { camera.position.copy(previous); camera.lookAt(0, 0, 0) }
  }, [camera])
  const colony = state.cosmos.colonies[index], surface = colony.surface
  const color = DESTINATIONS[index].color
  return <>
    <OrbitControls enablePan={false} minDistance={7} maxDistance={20} />
    <ambientLight intensity={1.4} /><directionalLight position={[5, 8, 6]} intensity={2} />
    <mesh><sphereGeometry args={[4, 40, 24]} /><meshStandardMaterial color={color} flatShading roughness={1} /></mesh>
    {state.cosmos.shield > 0 && <mesh><sphereGeometry args={[4.5, 20, 12]} /><meshBasicMaterial color="#8fddff" wireframe transparent opacity={0.12} depthWrite={false} /></mesh>}
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.399) * 3, 0.6 + (i % 3) * 0.4, Math.cos(i * 2.399) * 3]} rotation={[0, i, 0]}><icosahedronGeometry args={[0.45 + (i % 3) * 0.12, 0]} /><meshStandardMaterial color={index === 2 ? '#4d999c' : '#827a72'} /></mesh>)}
    {colony.stage === 'settled' && <group position={[0, 3.8, 0]}>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.8, 0.9, 0.4, 8]} /><meshStandardMaterial color="#e5eced" /></mesh>
      <mesh position={[0, 0.7, 0]}><coneGeometry args={[0.35, 0.9, 8]} /><meshStandardMaterial color="#e6bb66" /></mesh>
      {Array.from({ length: Math.min(30, colony.population) }, (_, i) => <mesh key={`settler-${i}`} position={[Math.sin(i * 2.399) * (0.9 + i * 0.018), 0.17, Math.cos(i * 2.399) * (0.9 + i * 0.018)]}><capsuleGeometry args={[0.055, 0.14, 2, 6]} /><meshStandardMaterial color="#fff2ce" /></mesh>)}
      {Array.from({ length: surface.farms }, (_, i) => <mesh key={`farm-${i}`} position={[-1.4, 0.05, (i - 2.5) * 0.35]}><boxGeometry args={[0.5, 0.1, 0.25]} /><meshStandardMaterial color="#71b959" /></mesh>)}
      {Array.from({ length: surface.habitats }, (_, i) => <mesh key={`home-${i}`} position={[1.2, 0.2, (i - 2.5) * 0.35]}><boxGeometry args={[0.3, 0.4, 0.3]} /><meshStandardMaterial color="#c8dee5" /></mesh>)}
      {Array.from({ length: surface.turrets }, (_, i) => <group key={`turret-${i}`} position={[Math.cos(i * Math.PI / 3) * 1.6, 0, Math.sin(i * Math.PI / 3) * 1.6]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.08, 0.13, 0.4, 6]} /><meshStandardMaterial color="#657b8b" /></mesh>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.15, 0.12, 0.4]} /><meshStandardMaterial color="#9ff6ff" /></mesh>
      </group>)}
      {surface.build && <mesh position={[0, 0.5, -1.2]}><boxGeometry args={[0.7, 1, 0.7]} /><meshBasicMaterial color="#f5c451" wireframe /></mesh>}
    </group>}
    {surface.dinosaurs.map(d => <DinosaurModel key={d.id} angle={d.angle} approach={d.approach} hurt={d.hp < 40} />)}
  </>
}

function DinosaurModel({ angle, approach, hurt }: { angle: number; approach: number; hurt: boolean }) {
  const root = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!root.current) return
    const radius = 3.5 - approach * 1.7
    root.current.position.set(Math.cos(angle) * radius, Math.sqrt(Math.max(0, 16 - radius * radius)) + 0.1, Math.sin(angle) * radius)
    root.current.rotation.y = -angle - Math.PI / 2
    root.current.rotation.z = Math.sin(clock.elapsedTime * 5 + angle) * 0.04
  })
  const green = hurt ? '#ba6e4e' : '#6e9250'
  return <group ref={root} scale={0.7}>
    <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.45, 0.55, 0.8]} /><meshStandardMaterial color={green} /></mesh>
    <mesh position={[0, 0.9, 0.55]}><boxGeometry args={[0.4, 0.35, 0.6]} /><meshStandardMaterial color={green} /></mesh>
    <mesh position={[0, 0.7, 0.75]}><boxGeometry args={[0.38, 0.09, 0.3]} /><meshStandardMaterial color="#cfbd83" /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.19, 0.15, 0]}><boxGeometry args={[0.13, 0.45, 0.2]} /><meshStandardMaterial color={green} /></mesh>
      <mesh position={[side * 0.215, 0.95, 0.7]}><sphereGeometry args={[0.035, 6, 4]} /><meshBasicMaterial color="#ffda62" /></mesh>
      <mesh position={[side * 0.27, 0.55, 0.3]} rotation={[0.7, 0, 0]}><boxGeometry args={[0.08, 0.1, 0.25]} /><meshStandardMaterial color={green} /></mesh>
    </group>)}
    <mesh position={[0, 0.4, -0.65]} rotation={[Math.PI / 2 + 0.2, 0, 0]}><coneGeometry args={[0.19, 1, 5]} /><meshStandardMaterial color={green} /></mesh>
  </group>
}
