// Keep browser commands, form navigation and overlay controls separate from gameplay.
export function ignoreGameShortcut(event: KeyboardEvent, modalOpen = false) {
  const target = event.target as HTMLElement | null
  return event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat || modalOpen ||
    !!target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), dialog, [role="dialog"], aside')
}

export function gameModalOpen() {
  return !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')
}
