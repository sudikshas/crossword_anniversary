import { useEffect, useState } from 'react'

/**
 * Tracks how many pixels of the screen's bottom edge are currently
 * covered by the on-screen keyboard, using the Visual Viewport API.
 *
 * Plain CSS viewport units (`vh`, and even `dvh` in some Safari versions)
 * don't reliably shrink to exclude the keyboard - `window.visualViewport`
 * is the one API that always reflects what's actually visible, so it's
 * the only fully dependable way to keep UI above the keyboard on iOS.
 *
 * Returns 0 when there's no keyboard open (or the API isn't supported).
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateInset = () => {
      // `window.innerHeight` is the full layout viewport height and stays
      // fixed even when the keyboard opens. `viewport.height` shrinks to
      // the actually-visible area. `viewport.offsetTop` corrects for the
      // visible area also having scrolled down within the layout
      // viewport (e.g. while the page is scrolled with the keyboard up).
      const covered = window.innerHeight - viewport.height - viewport.offsetTop
      setInset(Math.max(0, Math.round(covered)))
    }

    updateInset()
    viewport.addEventListener('resize', updateInset)
    viewport.addEventListener('scroll', updateInset)

    return () => {
      viewport.removeEventListener('resize', updateInset)
      viewport.removeEventListener('scroll', updateInset)
    }
  }, [])

  return inset
}
