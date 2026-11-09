/** Only errors attributed to our own script can terminate the game from window.error.
 * React render and simulation failures are handled at their own boundaries already.
 * Cross-origin/opaque script errors must not turn ad failures into game failures.
 */
export function isGameRuntimeError(event: Pick<ErrorEvent, 'filename' | 'error'>, origin: string): boolean {
  if (event.filename) {
    try { return new URL(event.filename, origin).origin === origin }
    catch { return false }
  }
  const stack = event.error && typeof event.error.stack === 'string' ? event.error.stack : ''
  return stack.includes(`${origin}/_next/static/`)
}

/** No raw messages, URLs, stack traces, account information or saves in stored reports. */
export function crashCode(error: unknown): string {
  const value = error instanceof Error ? `${error.name}:${error.message}` : 'unknown'
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return `GL-${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`
}
