'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { state } from '@/lib/game/store'

// Render and capture in one task; no preserveDrawingBuffer cost during normal play.
export function PhotoCapture() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let mounted = true
    const report = (text: string) => window.dispatchEvent(new CustomEvent('godlight-photo-result', { detail: text }))
    const capture = () => {
      if (!state.photoMode) return
      try {
        gl.setRenderTarget(null)
        gl.render(scene, camera)
        gl.domElement.toBlob(blob => {
          if (!mounted) return
          if (!blob) { report('Photo unavailable on this device. Try a device screenshot instead.'); return }
          try {
            const url = URL.createObjectURL(blob), link = document.createElement('a')
            link.href = url; link.download = 'godlight-planet.png'; link.click()
            setTimeout(() => URL.revokeObjectURL(url), 10_000)
            report('PNG download requested. Photos show the planet without HUD or postprocessing.')
          } catch { report('Downloads unavailable here. Try a device screenshot instead.') }
        }, 'image/png')
      } catch { report('Photo unavailable on this device. Try a device screenshot instead.') }
    }
    window.addEventListener('godlight-photo', capture)
    return () => { mounted = false; window.removeEventListener('godlight-photo', capture) }
  }, [gl, scene, camera])
  return null
}
