// Bounded device-only diagnostic codes. Never collect saves, account data, or arbitrary error text.
export function recordCrash(source: 'render' | 'runtime' | 'promise' | 'webgl') {
  try {
    const key = 'godlight-diagnostics-v1'
    const value = JSON.parse(sessionStorage.getItem(key) || '[]')
    const previous = Array.isArray(value) ? value.slice(-9) : []
    sessionStorage.setItem(key, JSON.stringify([...previous, { source, at: new Date().toISOString() }]))
  } catch { /* Diagnostics must never interrupt recovery. */ }
}
