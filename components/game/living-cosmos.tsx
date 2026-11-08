'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import { state } from '@/lib/game/store'
import { DESTINATIONS, type Blueprint } from '@/lib/game/cosmos'
import { isLand, OCEAN_RADIUS, PLANET_RADIUS, surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'

const NO_RAYCAST = () => null

export function LivingCosmos() {
  return <>
    {(['bunker', 'pyramid', 'obelisk', 'colosseum'] as const).map(kind => <Wonder key={kind} kind={kind} />)}
    <Champions />
    <Wildlife />
    <WeatherFront />
    <SkyThreats />
    <RelicMarkers />
    {DESTINATIONS.map((_, i) => <ColonyWorld key={i} index={i} />)}
  </>
}

function Wonder({ kind }: { kind: Blueprint }) {
  const root = useRef<Group>(null)
  const model = useRef<Group>(null)
  const columns = useMemo(() => Array.from({ length: 12 }, (_, i) => i * Math.PI / 6), [])
  const dir = useMemo(() => new Vector3(), [])
  useFrame(() => {
    const p = state.cosmos.projects.find(p => p.kind === kind)
    if (!root.current || !model.current) return
    root.current.visible = !!p
    if (!p) return
    dir.fromArray(p.dir)
    surfacePoint(dir, root.current.position, -0.02)
    surfaceQuaternion(dir, 0, root.current.quaternion)
    model.current.scale.y = 0.08 + p.progress * 0.92
  })
  return <group ref={root} visible={false}>
    <mesh position={[0, 0.04, 0]} raycast={NO_RAYCAST}><cylinderGeometry args={[0.65, 0.7, 0.08, 12]} /><meshStandardMaterial color="#706855" roughness={1} /></mesh>
    <group ref={model}>
      {kind === 'pyramid' && <>
        {[0, 1, 2, 3].map(i => <mesh key={i} position={[0, 0.12 + i * 0.21, 0]} rotation={[0, Math.PI / 4, 0]} raycast={NO_RAYCAST}>
          <boxGeometry args={[1.1 - i * 0.25, 0.22, 1.1 - i * 0.25]} /><meshStandardMaterial color={i === 3 ? '#f8d56e' : '#d4b67c'} roughness={0.8} />
        </mesh>)}
      </>}
      {kind === 'obelisk' && <>
        <mesh position={[0, 0.6, 0]} raycast={NO_RAYCAST}><cylinderGeometry args={[0.12, 0.25, 1.2, 4]} /><meshStandardMaterial color="#d6c3a1" roughness={0.7} /></mesh>
        <mesh position={[0, 1.3, 0]} raycast={NO_RAYCAST}><coneGeometry args={[0.17, 0.3, 4]} /><meshBasicMaterial color="#ffe38c" /></mesh>
      </>}
      {kind === 'bunker' && <>
        <mesh position={[0, 0.05, 0]} raycast={NO_RAYCAST}><sphereGeometry args={[0.58, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#788c7e" roughness={1} /></mesh>
        <mesh position={[0, 0.12, 0.53]} raycast={NO_RAYCAST}><boxGeometry args={[0.25, 0.25, 0.05]} /><meshBasicMaterial color="#15252e" /></mesh>
      </>}
      {kind === 'colosseum' && <>
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}><torusGeometry args={[0.5, 0.13, 4, 24]} /><meshStandardMaterial color="#bdab92" /></mesh>
        {columns.map((a, i) => <mesh key={i} position={[Math.cos(a) * 0.5, 0.32, Math.sin(a) * 0.5]} raycast={NO_RAYCAST}><boxGeometry args={[0.075, 0.4, 0.075]} /><meshStandardMaterial color="#eee0c5" /></mesh>)}
        <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}><torusGeometry args={[0.5, 0.075, 4, 24]} /><meshStandardMaterial color="#d8c4a5" /></mesh>
      </>}
    </group>
  </group>
}

function Champions() {
  const root = useRef<Group>(null)
  const dir = useMemo(() => new Vector3(), [])
  useFrame(({ clock }) => {
    if (!root.current) return
    for (let i = 0; i < 2; i++) {
      const mesh = root.current.children[i]
      const h = state.cosmos.champions[i]
      mesh.visible = !!h
      if (!h) continue
      dir.fromArray(h.dir)
      surfacePoint(dir, mesh.position, 0.1 + Math.sin(clock.elapsedTime * 3) * 0.025)
      surfaceQuaternion(dir, clock.elapsedTime * 0.2, mesh.quaternion)
    }
  })
  return <group ref={root}>{[0, 1].map(i => <group key={i} visible={false}>
    <mesh position={[0, 0.24, 0]} raycast={NO_RAYCAST}><coneGeometry args={[0.12, 0.45, 8]} /><meshStandardMaterial color={i === 0 ? '#e6d69c' : '#88b9e5'} /></mesh>
    <mesh position={[0, 0.5, 0]} raycast={NO_RAYCAST}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#e4bc97" /></mesh>
    <mesh position={[0, 0.67, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}><torusGeometry args={[0.13, 0.02, 4, 20]} /><meshBasicMaterial color={i === 0 ? '#ffe390' : '#92d7ff'} /></mesh>
    <mesh position={[0.15, 0.3, 0]} raycast={NO_RAYCAST}><cylinderGeometry args={[0.015, 0.015, 0.55, 5]} /><meshStandardMaterial color="#947550" /></mesh>
  </group>)}</group>
}

function Wildlife() {
  const bodies = useRef<InstancedMesh>(null)
  const details = useRef<InstancedMesh>(null)
  const tmp = useMemo(() => ({ obj: new Object3D(), d: new Vector3(), axis: new Vector3(0, 1, 0), color: new Color() }), [])
  const animals = useMemo(() => {
    // Seeded visual distribution; samples are bounded and stay independent of gameplay RNG.
    let seed = 42
    const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
    return Array.from({ length: 48 }, (_, i) => {
      const kind = i < 20 ? 'herd' : i < 34 ? 'bird' : 'fish'
      let dir = new Vector3(0, 1, 0)
      for (let j = 0; j < 120; j++) {
        dir.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize()
        if (kind === 'bird' || isLand(dir) === (kind === 'herd')) break
      }
      return { kind, dir, phase: rand() * Math.PI * 2 }
    })
  }, [])
  useFrame(({ clock }) => {
    if (!bodies.current || !details.current) return
    const { obj, d, color } = tmp, health = state.cosmos.ecosystem / 100
    let n = 0
    for (let i = 0; i < animals.length; i++) {
      if ((i % 10) / 10 >= health) continue
      const a = animals[i], t = clock.elapsedTime * (a.kind === 'bird' ? 0.08 : 0.025) + a.phase
      d.copy(a.dir).applyAxisAngle(tmp.axis, a.kind === 'bird' ? t : Math.sin(t) * 0.015)
      if (a.kind === 'fish') obj.position.copy(d).multiplyScalar(OCEAN_RADIUS + 0.04)
      else surfacePoint(d, obj.position, a.kind === 'bird' ? 1.2 + Math.sin(t * 4) * 0.15 : 0.08)
      surfaceQuaternion(d, t, obj.quaternion)
      obj.scale.set(a.kind === 'herd' ? 0.12 : 0.08, a.kind === 'bird' ? 0.025 : 0.06, a.kind === 'fish' ? 0.18 : 0.2)
      obj.updateMatrix(); bodies.current.setMatrixAt(n, obj.matrix)
      color.set(a.kind === 'herd' ? '#c1a17a' : a.kind === 'bird' ? '#e9dfc5' : '#68cfdb'); bodies.current.setColorAt(n, color)
      obj.position.addScaledVector(d, a.kind === 'herd' ? 0.08 : 0.01)
      obj.scale.set(a.kind === 'bird' ? 0.25 : 0.06, a.kind === 'bird' ? 0.015 + Math.abs(Math.sin(t * 35)) * 0.05 : 0.07, 0.07)
      obj.updateMatrix(); details.current.setMatrixAt(n, obj.matrix); details.current.setColorAt(n, color)
      n++
    }
    for (const mesh of [bodies.current, details.current]) { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true }
  })
  return <group>
    <instancedMesh ref={bodies} args={[undefined, undefined, 48]} frustumCulled={false} raycast={NO_RAYCAST}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={1} /></instancedMesh>
    <instancedMesh ref={details} args={[undefined, undefined, 48]} frustumCulled={false} raycast={NO_RAYCAST}><coneGeometry args={[1, 1, 3]} /><meshStandardMaterial roughness={1} /></instancedMesh>
  </group>
}

function WeatherFront() {
  const root = useRef<Group>(null), particles = useRef<InstancedMesh>(null), haze = useRef<Mesh>(null)
  const tmp = useMemo(() => ({ dir: new Vector3(), obj: new Object3D(), color: new Color() }), [])
  useFrame(({ clock }) => {
    if (!root.current || !particles.current || !haze.current) return
    const w = state.cosmos.weather
    root.current.visible = w.kind !== 'clear'
    if (w.kind === 'clear') return
    tmp.dir.fromArray(w.dir)
    root.current.position.copy(tmp.dir).multiplyScalar(PLANET_RADIUS + 0.5)
    surfaceQuaternion(tmp.dir, 0, root.current.quaternion)
    const color = w.kind === 'drought' ? '#ec9c4e' : w.kind === 'blizzard' ? '#e6f4ff' : '#7dbde5'
    ;(haze.current.material as MeshBasicMaterial).color.set(color)
    haze.current.rotation.y = clock.elapsedTime * 0.04
    for (let i = 0; i < 64; i++) {
      const a = i * 2.399, r = Math.sqrt(i / 64) * 3.5
      const fall = (clock.elapsedTime * (w.kind === 'blizzard' ? 0.8 : 2.5) + i * 0.17) % 2
      tmp.obj.position.set(Math.cos(a) * r, 2 - fall, Math.sin(a) * r)
      tmp.obj.scale.set(0.025, w.kind === 'monsoon' ? 0.16 : 0.035, 0.025)
      tmp.obj.updateMatrix(); particles.current.setMatrixAt(i, tmp.obj.matrix); particles.current.setColorAt(i, tmp.color.set(color))
    }
    particles.current.count = w.kind === 'drought' ? 12 : 64
    particles.current.instanceMatrix.needsUpdate = true
    if (particles.current.instanceColor) particles.current.instanceColor.needsUpdate = true
  })
  return <group ref={root} visible={false}>
    <mesh ref={haze} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}><ringGeometry args={[3.3, 3.6, 48]} /><meshBasicMaterial transparent opacity={0.3} depthWrite={false} side={DoubleSide} /></mesh>
    <instancedMesh ref={particles} args={[undefined, undefined, 64]} frustumCulled={false} raycast={NO_RAYCAST}><sphereGeometry args={[1, 4, 3]} /><meshBasicMaterial /></instancedMesh>
  </group>
}

function SkyThreats() {
  const shield = useRef<Mesh>(null), meteors = useRef<Group>(null), flare = useRef<Mesh>(null)
  const tmp = useMemo(() => ({ dir: new Vector3(), from: new Vector3(), to: new Vector3() }), [])
  useFrame(({ clock }) => {
    const c = state.cosmos, d = c.disaster
    if (shield.current) { shield.current.visible = c.shield > 0; (shield.current.material as MeshBasicMaterial).opacity = 0.06 + Math.sin(clock.elapsedTime * 3) * 0.02 }
    if (meteors.current) for (let i = 0; i < 3; i++) {
      const body = meteors.current.children[i]
      body.visible = !!d && d.kind === 'meteors' && !d.resolved
      if (!d || d.kind !== 'meteors' || d.resolved) continue
      tmp.dir.fromArray(d.targets[i] ?? d.targets[0])
      surfacePoint(tmp.dir, tmp.to, 0.1)
      tmp.from.copy(tmp.dir).applyAxisAngle(new Vector3(0, 1, 0), 0.55).multiplyScalar(48)
      body.position.lerpVectors(tmp.from, tmp.to, Math.max(0, 1 - d.remaining / d.duration))
      body.lookAt(tmp.to)
    }
    if (flare.current) {
      flare.current.visible = !!d && d.kind === 'flare' && !d.resolved
      flare.current.rotation.z = clock.elapsedTime * 0.2
      flare.current.scale.setScalar(d ? 1 + Math.max(0, 1 - d.remaining / 25) * 0.4 : 1)
    }
  })
  return <>
    <mesh ref={shield} visible={false} raycast={NO_RAYCAST}><sphereGeometry args={[PLANET_RADIUS + 1.6, 32, 20]} /><meshBasicMaterial color="#7edbff" wireframe transparent opacity={0.07} depthWrite={false} /></mesh>
    <group ref={meteors}>{[0, 1, 2].map(i => <group key={i} visible={false}>
      <mesh raycast={NO_RAYCAST}><icosahedronGeometry args={[0.25, 0]} /><meshBasicMaterial color={[2.8, 1.1, 0.2]} toneMapped={false} /></mesh>
      <mesh position={[0, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}><coneGeometry args={[0.18, 1.6, 6]} /><meshBasicMaterial color="#e6a264" transparent opacity={0.6} depthWrite={false} /></mesh>
    </group>)}</group>
    <mesh ref={flare} visible={false} raycast={NO_RAYCAST}><torusGeometry args={[12, 0.06, 4, 64]} /><meshBasicMaterial color={[2.5, 0.7, 0.1]} transparent opacity={0.5} toneMapped={false} depthWrite={false} /></mesh>
  </>
}

function RelicMarkers() {
  const root = useRef<Group>(null), dir = useMemo(() => new Vector3(), [])
  useFrame(({ clock }) => {
    if (!root.current) return
    for (let i = 0; i < 4; i++) {
      const mesh = root.current.children[i], r = state.cosmos.relics[i]
      mesh.visible = r.revealed
      dir.fromArray(r.dir); surfacePoint(dir, mesh.position, 0.3 + Math.sin(clock.elapsedTime * 2 + i) * 0.08)
      surfaceQuaternion(dir, clock.elapsedTime * 0.5, mesh.quaternion)
      mesh.scale.setScalar(r.progress >= 1 ? 0.5 : 1)
    }
  })
  return <group ref={root}>{[0, 1, 2, 3].map(i => <mesh key={i} visible={false} raycast={NO_RAYCAST}><octahedronGeometry args={[0.16]} /><meshBasicMaterial color={i % 2 ? '#8dc7ff' : '#ffe5a6'} /></mesh>)}</group>
}

function ColonyWorld({ index }: { index: number }) {
  const root = useRef<Group>(null), rocket = useRef<Mesh>(null), city = useRef<Group>(null)
  const normal = useMemo(() => new Vector3(), [])
  useFrame(({ clock }) => {
    if (!root.current || !rocket.current || !city.current) return
    const colony = state.cosmos.colonies[index]
    root.current.visible = colony.surveyed
    const angle = clock.elapsedTime * 0.01 + index * Math.PI * 2 / 3
    root.current.position.set(Math.cos(angle) * 18, 8 + index * 3, Math.sin(angle) * 18)
    city.current.visible = colony.stage === 'settled'
    city.current.rotation.y = clock.elapsedTime * 0.08
    rocket.current.visible = colony.stage === 'launching'
    normal.copy(root.current.position).normalize()
    rocket.current.position.copy(root.current.position).multiplyScalar(0.45 + colony.progress * 0.55).sub(root.current.position)
    rocket.current.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), normal)
  })
  return <group ref={root} visible={false}>
    <mesh raycast={NO_RAYCAST}><icosahedronGeometry args={[1 + index * 0.15, 2]} /><meshStandardMaterial color={DESTINATIONS[index].color} roughness={0.9} flatShading /></mesh>
    <group ref={city} visible={false}>{[0, 1, 2].map(i => <mesh key={i} position={[Math.sin(i * 2) * 0.4, 1.1 + index * 0.15, Math.cos(i * 2) * 0.4]} raycast={NO_RAYCAST}><boxGeometry args={[0.14, 0.3, 0.14]} /><meshBasicMaterial color="#e7f8ff" /></mesh>)}</group>
    <mesh ref={rocket} visible={false} raycast={NO_RAYCAST}><coneGeometry args={[0.12, 0.55, 8]} /><meshBasicMaterial color="#ffdd99" /></mesh>
  </group>
}
