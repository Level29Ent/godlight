'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function RenderBudget({ batterySaver }: { batterySaver: boolean }) {
  const invalidate = useThree(s => s.invalidate)
  const setFrameloop = useThree(s => s.setFrameloop)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const update = () => {
      clearInterval(timer)
      if (document.hidden) { setFrameloop('never'); return }
      setFrameloop(batterySaver ? 'demand' : 'always')
      if (batterySaver) timer = setInterval(() => invalidate(), 1000 / 30)
      invalidate()
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [batterySaver, invalidate, setFrameloop])
  return null
}
