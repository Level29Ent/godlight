'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { CameraRig } from './camera-rig'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { DirectionalLight, Group, Vector3 } from 'three'
import { PLANET_RADIUS } from '@/lib/game/planet'
import { state, tick, useGame } from '@/lib/game/store'
import { Planet } from './planet'
import { Followers } from './followers'
import { Invaders } from './invaders'
import { Tether } from './tether'
import { Trees } from './trees'
import { Rocks } from './rocks'
import { Buildings } from './buildings'
import { CursorFX } from './cursor-fx'
import { Effects } from './effects'
import { ParticleSystem } from './particles'

function Simulation() {
  useFrame((_, dt) => tick(Math.min(dt, 0.05)))
  return null
}

function CameraLight() {
  const light = useRef<DirectionalLight>(null)
  const tmp = useMemo(() => new Vector3(), [])
  useFrame(({ camera }) => {
    if (!light.current) return
    tmp.copy(camera.up).multiplyScalar(6)
    const right = new Vector3().crossVectors(camera.getWorldDirection(new Vector3()), camera.up).normalize()
    tmp.addScaledVector(right, -5)
    light.current.position.copy(camera.position).add(tmp).setLength(PLANET_RADIUS * 4)
    light.current.target.position.set(0, 0, 0)
    light.current.target.updateMatrixWorld()
  })
  const s = PLANET_RADIUS + 1.5
  return (
    <directionalLight
      ref={light}
      intensity={2.6}
      color="#fff3df"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-s}
      shadow-camera-right={s}
      shadow-camera-top={s}
      shadow-camera-bottom={-s}
      shadow-camera-near={5}
      shadow-camera-far={PLANET_RADIUS * 8}
    />
  )
}

function AmbientClouds() {
  const clouds = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        axis: new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        speed: 0.02 + Math.random() * 0.03,
        offset: (i / 9) * Math.PI * 2,
        height: PLANET_RADIUS + 1.1 + Math.random() * 0.4,
        scale: 0.6 + Math.random() * 0.5,
        puffs: Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => [
          (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.5,
          0.18 + Math.random() * 0.16,
        ]),
      })),
    [],
  )
  return (
    <group>
      {clouds.map((c, i) => (
        <Cloud key={i} {...c} />
      ))}
    </group>
  )
}

function Cloud({
  axis,
  speed,
  offset,
  height,
  scale,
  puffs,
}: {
  axis: Vector3
  speed: number
  offset: number
  height: number
  scale: number
  puffs: number[][]
}) {
  const pivot = useRef<Group>(null)
  useFrame(({ clock }) => {
    pivot.current?.quaternion.setFromAxisAngle(axis, offset + clock.elapsedTime * speed)
  })
  const perp = useMemo(() => {
    const p = new Vector3(1, 0, 0)
    if (Math.abs(axis.dot(p)) > 0.9) p.set(0, 1, 0)
    return p.sub(axis.clone().multiplyScalar(axis.dot(p))).normalize().multiplyScalar(height)
  }, [axis, height])
  return (
    <group ref={pivot}>
      <group position={perp} scale={scale} onUpdate={(g) => g.lookAt(0, 0, 0)}>
        {puffs.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, z, y]} castShadow raycast={() => null}>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={1} flatShading transparent opacity={0.92} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function ShakeGroup({ children }: { children: React.ReactNode }) {
  const g = useRef<Group>(null)
  useFrame(() => {
    if (!g.current) return
    const s = state.shake * 0.18
    g.current.position.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s)
  })
  return <group ref={g}>{children}</group>
}

export function Scene() {
  const started = useGame((s) => s.started)
  return (
    <>
      <color attach="background" args={['#060817']} />
      <fog attach="fog" args={['#060817', 55, 130]} />
      <Stars radius={110} depth={50} count={6000} factor={5} saturation={0.3} fade speed={0.6} />
      <hemisphereLight args={['#cfe8ff', '#3b2c4f', 0.7]} />
      <ambientLight intensity={0.18} />
      <CameraLight />
      <CameraRig />
      <Simulation />
      <ShakeGroup>
        <Planet />
        <Trees />
        <Rocks />
        <Buildings />
        <Followers />
        <Invaders />
        <Tether />
        <AmbientClouds />
        <CursorFX />
        <Effects />
        <ParticleSystem kind="faith" />
        <ParticleSystem kind="ember" />
        <ParticleSystem kind="spark" />
        <ParticleSystem kind="leaf" />
        <ParticleSystem kind="dust" />
      </ShakeGroup>
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.15} radius={0.7} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
