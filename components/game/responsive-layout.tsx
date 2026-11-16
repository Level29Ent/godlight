'use client'

import { useLayoutEffect, type RefObject } from 'react'

// Reserve the actual rendered heights, including text wrapping, zoom and safe-area padding.
export function useGameLayout(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const update = () => {
      const dock = element.querySelector<HTMLElement>('[data-game-dock]')
      const header = element.querySelector<HTMLElement>('[data-game-header]')
      element.style.setProperty('--game-dock-height', `${Math.ceil(dock?.getBoundingClientRect().height ?? 0)}px`)
      element.style.setProperty('--game-header-height', `${Math.ceil(header?.getBoundingClientRect().height ?? 0)}px`)
    }
    const observer = new ResizeObserver(update)
    const watch = () => {
      observer.disconnect()
      observer.observe(element)
      for (const child of element.querySelectorAll<HTMLElement>('[data-game-dock], [data-game-header]')) observer.observe(child)
      update()
    }
    // Modes mount/unmount header/dock children without a viewport resize.
    const mutations = new MutationObserver(watch)
    mutations.observe(element, { childList: true, subtree: true })
    watch()
    return () => { observer.disconnect(); mutations.disconnect() }
  }, [root])
}
