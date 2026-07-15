import { useEffect, useState } from 'react'

// The layout viewport (`100dvh`, `window.innerHeight`) never shrinks when
// the iOS on-screen keyboard opens - only `visualViewport.height` does, by
// exactly the amount the keyboard covers. Reading that directly (rather
// than deriving a separate "inset" to subtract from a fixed-height layout)
// is what lets the puzzle screen's own height track the keyboard precisely:
// set the screen's height to this value and everything inside it - the
// grid and the clue card - naturally has to fit above the keyboard, with
// no separate math needed to keep them from being covered by it.
export function useVisualViewportHeight() {
  const [height, setHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  )

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateHeight = () => setHeight(viewport.height)

    updateHeight()
    viewport.addEventListener('resize', updateHeight)
    viewport.addEventListener('scroll', updateHeight)

    return () => {
      viewport.removeEventListener('resize', updateHeight)
      viewport.removeEventListener('scroll', updateHeight)
    }
  }, [])

  return height
}
