'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'
import { isGameRuntimeError, crashCode } from '@/lib/game/runtime-errors'
import { recordCrash } from '@/lib/game/crash-log'

export function RuntimeDiagnostics() {
  const [failure, setFailure] = useState<Error | null>(null)
  useEffect(() => {
    const error = (event: ErrorEvent) => {
      recordCrash('runtime')
      if (isGameRuntimeError(event, window.location.origin)) {
        setFailure(event.error instanceof Error ? event.error : new Error('Game runtime interrupted'))
      }
    }
    const rejection = () => recordCrash('promise')
    window.addEventListener('error', error)
    window.addEventListener('unhandledrejection', rejection)
    return () => {
      window.removeEventListener('error', error)
      window.removeEventListener('unhandledrejection', rejection)
    }
  }, [])
  if (failure) throw failure
  return null
}

export class GameBoundary extends Component<{ children: ReactNode }, { failed: boolean; code: string }> {
  state = { failed: false, code: '' }
  static getDerivedStateFromError(error: unknown) { return { failed: true, code: crashCode(error) } }
  componentDidCatch() { recordCrash('render') }
  render() {
    if (!this.state.failed) return this.props.children
    return <main role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#060817] p-6 text-center text-[#f4ecd8]">
      <h1 className="font-display text-3xl">Your world needs a moment</h1>
      <p className="font-mono text-sm">Error code: {this.state.code}</p>
      <p>Reload, then choose “Continue on this device” to restore your most recent device save.</p>
      <button type="button" className="rounded-full bg-[#f5c451] px-8 py-3 text-[#1a1406]" onClick={() => location.reload()}>Reload Godlight</button>
    </main>
  }
}
