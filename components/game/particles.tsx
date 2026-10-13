'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Points, Vector3 } from 'three'
import { state, type ParticleKind } from '@/lib/game/store'

interface Config {
  max: number
  size: number
  life: [number, number]
  color: [number, number, number]
  rise: number
  burst: number
  gravity: number
  drag: number
}

const CONFIGS: Record<ParticleKind, Config> = {
  faith: { max: 500, size: 0.14, life: [1.4, 2.4], color: [2.2, 1.7, 0.6], rise: 0.7, burst: 0.25, gravity: 0, drag: 0.6 },
  ember: { max: 700, size: 0.1, life: [0.6, 1.3], color: [3, 1.1, 0.25], rise: 0.9, burst: 0.3, gravity: 0, drag: 1.2 },
  spark: { max: 500, size: 0.09, life: [0.4, 0.9], color: [3, 2.6, 1.8], rise: 1.6, burst: 2.6, gravity: 4, drag: 1.5 },
}

let sharedTexture: CanvasTexture | null = null
function getTexture() {
  if (sharedTexture) return sharedTexture
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  sharedTexture = new CanvasTexture(c)
  return sharedTexture
}

export function ParticleSystem({ kind }: { kind: ParticleKind }) {
  const cfg = CONFIGS[kind]
  const points = useRef<Points>(null)
  const sim = useMemo(() => {
    const geo = new BufferGeometry()
    const pos = new Float32Array(cfg.max * 3)
    const col = new Float32Array(cfg.max * 3)
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('color', new BufferAttribute(col, 3))
    return {
      geo,
      pos,
      col,
      vel: new Float32Array(cfg.max * 3),
      life: new Float32Array(cfg.max),
      maxLife: new Float32Array(cfg.max).fill(1),
      cursor: 0,
    }
  }, [cfg.max])
  const tmp = useMemo(() => ({ r: new Vector3(), n: new Vector3() }), [])
  const texture = useMemo(() => (typeof document !== 'undefined' ? getTexture() : null), [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const queue = state.particleQueue
    for (let q = queue.length - 1; q >= 0; q--) {
      const req = queue[q]
      if (req.kind !== kind) continue
      queue.splice(q, 1)
      for (let k = 0; k < req.count; k++) {
        const i = sim.cursor
        sim.cursor = (sim.cursor + 1) % cfg.max
        tmp.r.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
        sim.pos[i * 3] = req.pos.x + tmp.r.x * req.spread
        sim.pos[i * 3 + 1] = req.pos.y + tmp.r.y * req.spread
        sim.pos[i * 3 + 2] = req.pos.z + tmp.r.z * req.spread
        const rise = cfg.rise * (0.6 + Math.random() * 0.8)
        const burst = cfg.burst * Math.random()
        sim.vel[i * 3] = req.up.x * rise + tmp.r.x * burst
        sim.vel[i * 3 + 1] = req.up.y * rise + tmp.r.y * burst
        sim.vel[i * 3 + 2] = req.up.z * rise + tmp.r.z * burst
        const l = cfg.life[0] + Math.random() * (cfg.life[1] - cfg.life[0])
        sim.life[i] = l
        sim.maxLife[i] = l
      }
    }

    const decay = Math.exp(-cfg.drag * dt)
    for (let i = 0; i < cfg.max; i++) {
      if (sim.life[i] <= 0) {
        sim.col[i * 3] = sim.col[i * 3 + 1] = sim.col[i * 3 + 2] = 0
        continue
      }
      sim.life[i] -= dt
      const ix = i * 3
      if (cfg.gravity) {
        tmp.n.set(sim.pos[ix], sim.pos[ix + 1], sim.pos[ix + 2]).normalize()
        sim.vel[ix] -= tmp.n.x * cfg.gravity * dt
        sim.vel[ix + 1] -= tmp.n.y * cfg.gravity * dt
        sim.vel[ix + 2] -= tmp.n.z * cfg.gravity * dt
      }
      sim.vel[ix] *= decay
      sim.vel[ix + 1] *= decay
      sim.vel[ix + 2] *= decay
      sim.pos[ix] += sim.vel[ix] * dt
      sim.pos[ix + 1] += sim.vel[ix + 1] * dt
      sim.pos[ix + 2] += sim.vel[ix + 2] * dt
      const a = Math.max(0, sim.life[i] / sim.maxLife[i])
      const fade = kind === 'faith' ? Math.sin(a * Math.PI) : a
      sim.col[ix] = cfg.color[0] * fade
      sim.col[ix + 1] = cfg.color[1] * fade * (kind === 'ember' ? 0.5 + a * 0.5 : 1)
      sim.col[ix + 2] = cfg.color[2] * fade
    }
    ;(sim.geo.attributes.position as BufferAttribute).needsUpdate = true
    ;(sim.geo.attributes.color as BufferAttribute).needsUpdate = true
  })

  return (
    <points ref={points} geometry={sim.geo} frustumCulled={false} raycast={() => null}>
      <pointsMaterial
        size={cfg.size}
        map={texture ?? undefined}
        vertexColors
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  )
}
