'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedMesh, Object3D, Vector3 } from 'three'
import { isPaused, state } from '@/lib/game/store'
import { PLANET_RADIUS, surfacePoint } from '@/lib/game/planet'
import { surfaceQuaternion } from '@/lib/game/orient'
import { wildlifeSound } from '@/lib/game/audio'
import { animalPose, createAnimalPose, wildlifeCatalog, wildlifeSites, wildlifeSoundLevel, type HabitatSite, type WildAnimal } from '@/lib/game/wildlife-life'
import { AnimalInstances, type AnimalPainter } from './animal-instances'

// Bounded catalog: 48 ambient animals, 18 habitat residents and two rare visitors.
export function WildlifeScene() {
  const painter = useRef<AnimalPainter>(null)
  const catalog = useRef<WildAnimal[]>([])
  const lastRefresh = useRef(-Infinity), lastSound = useRef(-Infinity)
  const pose = useMemo(createAnimalPose, [])
  useFrame(({ camera }) => {
    if (!painter.current) return
    if (state.time < lastRefresh.current || state.time - lastRefresh.current >= 0.5) {
      catalog.current = wildlifeCatalog(state); lastRefresh.current = state.time
    }
    painter.current.begin()
    let loudest = 0, sound: 'bird' | 'splash' | 'rustle' = 'bird'
    for (const animal of catalog.current) {
      animalPose(animal, state.time, pose)
      painter.current.draw(animal.kind, pose.matrix, state.time, animal.phase, animal.id, pose.grazing, animal.rare, pose.flight)
      const level = wildlifeSoundLevel(camera.position, pose.root.position)
      if (level > loudest) { loudest = level; sound = animal.kind === 'bird' ? 'bird' : animal.kind === 'fish' ? 'splash' : 'rustle' }
    }
    painter.current.end()
    if (state.time < lastSound.current) lastSound.current = -Infinity
    if (state.started && !state.gameOver && !isPaused() && !document.hidden && state.time - lastSound.current > 4) {
      if (loudest > 0.02) wildlifeSound(sound, loudest)
      lastSound.current = state.time
    }
  })
  return <><AnimalInstances ref={painter} capacity={68} /><HabitatPlants /></>
}

function HabitatPlants() {
  const mesh = useRef<InstancedMesh>(null), last = useRef(-Infinity)
  const sites = useRef<HabitatSite[]>([])
  const scratch = useMemo(() => ({ root: new Object3D(), local: new Object3D(), dir: new Vector3(), color: new Color() }), [])
  useFrame(() => {
    if (!mesh.current || state.time >= last.current && state.time - last.current < 0.5) return
    last.current = state.time; sites.current = wildlifeSites(state)
    let count = 0
    const { root, local, dir, color } = scratch
    for (const site of sites.current) {
      if (site.kind === 'coast') continue
      surfaceQuaternion(site.dir, 0, root.quaternion)
      for (let i = 0; i < 12; i++) {
        const a = i * 2.399, r = 0.08 + Math.sqrt(i / 12) * 0.42
        local.position.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(root.quaternion)
        dir.copy(site.dir).multiplyScalar(PLANET_RADIUS).add(local.position).normalize()
        surfacePoint(dir, local.position, site.kind === 'wetland' ? 0.12 : 0.04)
        surfaceQuaternion(dir, a, local.quaternion)
        local.scale.set(site.kind === 'meadow' ? 0.045 : 0.025, site.kind === 'wetland' ? 0.18 : site.kind === 'forest' ? 0.09 : 0.035, 0.025)
        local.updateMatrix(); mesh.current.setMatrixAt(count, local.matrix)
        color.set(site.kind === 'meadow' ? ['#f2d580', '#cdb6e9', '#f5e8d2'][i % 3] : site.kind === 'wetland' ? '#718d48' : '#41845a')
        mesh.current.setColorAt(count++, color)
      }
    }
    mesh.current.count = count; mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[undefined, undefined, 216]} frustumCulled={false} raycast={() => null}>
    <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={1} flatShading />
  </instancedMesh>
}
