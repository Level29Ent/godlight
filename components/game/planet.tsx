'use client'

import { useEffect, useMemo } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color } from 'three'
import { createPlanetGeometry, OCEAN_RADIUS, PLANET_RADIUS } from '@/lib/game/planet'
import { pressCursor, releaseCursor, setCursor, state, tetherClick } from '@/lib/game/store'

type Controls = { enabled: boolean } | null

export function Planet() {
  const geometry = useMemo(() => createPlanetGeometry(44), [])
  const controls = useThree((s) => s.controls) as Controls

  useEffect(() => {
    const up = () => {
      releaseCursor()
      if (controls) controls.enabled = true
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [controls])

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    setCursor(e.point.clone().normalize())
  }

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!state.started) return
    if (state.tool === 'hand') {
      if (tetherClick(e.point.clone().normalize())) e.stopPropagation()
      return
    }
    e.stopPropagation()
    pressCursor(e.point.clone().normalize())
    if (controls) controls.enabled = false
  }

  const onOut = () => {
    if (!state.cursor.down) setCursor(null)
  }

  return (
    <group>
      <mesh geometry={geometry} receiveShadow onPointerMove={onMove} onPointerDown={onDown} onPointerOut={onOut}>
        <meshStandardMaterial vertexColors flatShading roughness={0.92} metalness={0} />
      </mesh>
      <mesh raycast={() => null} receiveShadow>
        <sphereGeometry args={[OCEAN_RADIUS, 96, 64]} />
        <meshPhysicalMaterial
          color="#2f9fd6"
          transparent
          opacity={0.78}
          roughness={0.12}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <Atmosphere />
    </group>
  )
}

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(max(0.0, 0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    gl_FragColor = vec4(uColor * 1.6, intensity);
  }
`

function Atmosphere() {
  const uniforms = useMemo(() => ({ uColor: { value: new Color('#7cc4ff') } }), [])
  return (
    <mesh raycast={() => null} scale={PLANET_RADIUS * 1.24}>
      <sphereGeometry args={[1, 64, 48]} />
      <shaderMaterial
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        uniforms={uniforms}
        side={BackSide}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
