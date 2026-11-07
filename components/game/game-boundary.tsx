'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'
import { recordCrash } from '@/lib/game/crash-log'

export function RuntimeDiagnostics() {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const error = () => { recordCrash('runtime'); setFailed(true) }
    const rejection = () => recordCrash('promise')
    window.addEventListener('error', error)
    window.addEventListener('unhandledrejection', rejection)
    return () => {
      window.removeEventListener('error', error)
      window.removeEventListener('unhandledrejection', rejection)
    }
  }, [])
  if (failed) throw new Error('Game runtime interrupted')
  return null
}

export class GameBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { recordCrash('render') }
  render() {
    if (!this.state.failed) return this.props.children
    return <main role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#060817] p-6 text-center text-[#f4ecd8]">
      <h1 className="font-display text-3xl">Your world needs a moment</h1>
      <p>Reload, then choose “Continue on this device” to restore your most recent device save.</p>
      <button type="button" className="rounded-full bg-[#f5c451] px-8 py-3 text-[#1a1406]" onClick={() => location.reload()}>Reload Godlight</button>
    </main>
  }
}
