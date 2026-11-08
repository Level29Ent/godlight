import { Vector3 } from 'three'

const ROWS = 64
const COLS = 128
const COUNT = ROWS * COLS
const EDGE_SAMPLE = 0.002
const TAU = Math.PI * 2
interface Walker { dir: Vector3 }
interface Route { goal: Vector3; points: Vector3[]; index: number; failed: boolean }

/** Static-terrain graph shared by all walkers. Search is limited to one per simulation tick. */
export function createLandNavigator(land: (d: Vector3) => boolean) {
  let nodes: Vector3[] | null = null
  const edges = new Map<number, number[]>()
  const dry = new Uint8Array(COUNT)
  const failures = new WeakMap<Walker, { goal: Vector3; from: Vector3 }[]>()
  const routes = new WeakMap<Walker, Route>()
  const sample = new Vector3(), axis = new Vector3()
  let searches = 1
  function clear(a: Vector3, b: Vector3) {
    const angle = a.angleTo(b)
    if (angle > Math.PI - 0.001) return false
    const steps = Math.max(1, Math.ceil(angle / EDGE_SAMPLE))
    for (let i = 1; i <= steps; i++) {
      sample.copy(a).lerp(b, i / steps).normalize()
      if (!land(sample)) return false
    }
    return true
  }
  function graph() {
    if (nodes) return nodes
    nodes = Array.from({ length: COUNT }, (_, id) => {
      const row = Math.floor(id / COLS), col = id % COLS
      const lat = -Math.PI / 2 + (row + 0.5) * Math.PI / ROWS, lon = col * TAU / COLS
      const d = new Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon))
      return d
    })
    for (let i = 0; i < COUNT; i++) dry[i] = land(nodes[i]) ? 1 : 0
    return nodes
  }
  function neighbors(id: number) {
    const cached = edges.get(id)
    if (cached) return cached
    const all = graph(), out: number[] = [], row = Math.floor(id / COLS), col = id % COLS
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
      if ((!x && !y) || row + y < 0 || row + y >= ROWS) continue
      const next = (row + y) * COLS + (col + x + COLS) % COLS
      if (dry[next] && clear(all[id], all[next])) out.push(next)
    }
    edges.set(id, out)
    return out
  }
  function anchors(d: Vector3) {
    const all = graph()
    // Keep several coastal connectors: the nearest sample can be across a narrow inlet.
    const nearby: number[] = []
    const row = Math.max(0, Math.min(ROWS - 1, Math.floor((Math.asin(d.y) + Math.PI / 2) * ROWS / Math.PI)))
    const col = ((Math.round(Math.atan2(d.z, d.x) * COLS / TAU) % COLS) + COLS) % COLS
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      if (row + y < 0 || row + y >= ROWS) continue
      const id = (row + y) * COLS + (col + x + COLS) % COLS
      if (dry[id] && clear(d, all[id])) nearby.push(id)
    }
    return nearby.sort((a, b) => d.distanceToSquared(all[a]) - d.distanceToSquared(all[b])).slice(0, 6)
  }
  function plan(from: Vector3, goal: Vector3): Vector3[] | null {
    if (!land(goal)) return null
    if (clear(from, goal)) return [goal.clone()]
    const all = graph(), starts = anchors(from), ends = new Set(anchors(goal))
    if (!starts.length || !ends.size) return null
    const costs = new Float64Array(COUNT).fill(Infinity), parent = new Int32Array(COUNT).fill(-1)
    const closed = new Uint8Array(COUNT)
    const heap: { id: number; score: number }[] = []
    const push = (id: number, score: number) => {
      let i = heap.length
      heap.push({ id, score })
      while (i > 0) {
        const parent = (i - 1) >> 1
        if (heap[parent].score <= score) break
        heap[i] = heap[parent]; i = parent
      }
      heap[i] = { id, score }
    }
    const pop = () => {
      const first = heap[0], last = heap.pop()!
      if (heap.length) {
        let i = 0
        while (i * 2 + 1 < heap.length) {
          let child = i * 2 + 1
          if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++
          if (last.score <= heap[child].score) break
          heap[i] = heap[child]; i = child
        }
        heap[i] = last
      }
      return first.id
    }
    for (const id of starts) { costs[id] = from.distanceTo(all[id]); push(id, costs[id] + all[id].distanceTo(goal)) }
    for (let expanded = 0; heap.length && expanded < COUNT * 8; expanded++) {
      const best = pop()
      if (closed[best]) continue
      if (ends.has(best)) {
        const ids: number[] = []
        for (let id = best; id !== -1; id = parent[id]) ids.push(id)
        ids.reverse()
        return [...ids.map(id => all[id]), goal.clone()]
      }
      closed[best] = 1
      for (const next of neighbors(best)) {
        if (closed[next]) continue
        const cost = costs[best] + all[best].distanceTo(all[next])
        if (cost < costs[next]) { costs[next] = cost; parent[next] = best; push(next, cost + all[next].distanceTo(goal)) }
      }
    }
    return null
  }
  function move(w: Walker, goal: Vector3, speed: number, dt: number): 'moving' | 'arrived' | 'unreachable' {
    const step = Math.max(0, speed * dt / 7)
    if (w.dir.angleTo(goal) <= Math.max(step, 0.001)) {
      if (!land(goal)) return 'unreachable'
      w.dir.copy(goal); return 'arrived'
    }
    let route = routes.get(w)
    if (!route || route.goal.distanceToSquared(goal) > 0.000001) {
      let points: Vector3[] | null
      // Direct movement must not monopolize the shared detour-search budget.
      if (land(goal) && (!land(w.dir) || clear(w.dir, goal))) points = [goal.clone()]
      else {
        if (!searches) return 'moving'
        searches--
        points = plan(w.dir, goal)
      }
      route = { goal: goal.clone(), points: points ?? [], index: 0, failed: !points }
      routes.set(w, route)
      if (!points) failures.set(w, [...(failures.get(w) ?? []).slice(-7), { goal: goal.clone(), from: w.dir.clone() }])
    }
    if (route.failed) return 'unreachable'
    while (route.index < route.points.length - 1 && w.dir.angleTo(route.points[route.index]) < 1e-7) route.index++
    const target = route.points[route.index]
    const angle = w.dir.angleTo(target)
    if (angle > 1e-8) {
      axis.crossVectors(w.dir, target).normalize()
      sample.copy(w.dir).applyAxisAngle(axis, Math.min(step, angle)).normalize()
      if (land(w.dir) && !land(sample)) {
        route.failed = true
        failures.set(w, [...(failures.get(w) ?? []).slice(-7), { goal: goal.clone(), from: w.dir.clone() }])
        return 'unreachable'
      }
      w.dir.copy(sample)
    }
    return 'moving'
  }
  return { move, plan, isUnreachable(w: Walker, goal: Vector3) { return failures.get(w)?.some(d => d.goal.distanceToSquared(goal) < 0.0001 && d.from.distanceToSquared(w.dir) < 0.04) ?? false }, beginFrame() { searches = 1 }, clear }
}
