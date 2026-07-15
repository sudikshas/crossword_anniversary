import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import puzzleData from '../data/puzzle_data.json'
import { buildGrid } from '../utils/buildGrid'
import {
  buildCellIndex,
  buildLetterMap,
  cellKey,
  getWordCells,
} from '../utils/wordIndex'
import { useVisualViewportHeight } from '../utils/useVisualViewportHeight'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueCard from '../components/ClueCard'

const TOTAL_WORDS = puzzleData.length

function PuzzleScreen({ onComplete }) {
  const grid = useMemo(() => buildGrid(puzzleData), [])
  const cellIndex = useMemo(() => buildCellIndex(puzzleData), [])
  const letterMap = useMemo(() => buildLetterMap(puzzleData), [])
  const inputRefs = useRef(new Map())

  const [selection, setSelection] = useState(null)
  const [cellEntries, setCellEntries] = useState({})
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const hasCompletedRef = useRef(false)
  const clueCardRef = useRef(null)
  const containerRef = useRef(null)
  const viewportHeight = useVisualViewportHeight()

  const rowCount = grid.length
  const colCount = grid[0]?.length ?? 0

  // `.puzzle-container`'s own content-box size already reflects exactly
  // how much room is actually left for the grid at any moment - it's a
  // flex sibling of the clue card inside the fixed-height `.puzzle-screen`
  // (see below), so its size automatically shrinks whenever the clue card
  // grows or the keyboard opens. Measuring it directly here, rather than
  // separately tracking the clue card's height and the keyboard inset and
  // re-deriving the leftover space by hand, means there's only ever one
  // source of truth for "how much space is actually available."
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const cellSize = useMemo(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) return null

    const gapPx = 1.5
    const availableWidth = containerSize.width - gapPx * (colCount - 1)
    const availableHeight = containerSize.height - gapPx * (rowCount - 1)
    const rawSize = Math.min(availableWidth / colCount, availableHeight / rowCount)

    // Floored (not just clamped) so the grid never renders at a
    // fractional size that could leave a stray sliver of empty space
    // between it and the container's edge from rounding.
    return Math.max(8, Math.floor(rawSize))
  }, [containerSize, colCount, rowCount])

  const activeWord = selection
    ? cellIndex.get(cellKey(selection.row, selection.col))?.[selection.direction]
    : null

  const activeWordCells = useMemo(
    () => (activeWord ? getWordCells(activeWord) : []),
    [activeWord]
  )

  const activeWordCellKeys = useMemo(
    () => new Set(activeWordCells.map(({ row, col }) => cellKey(row, col))),
    [activeWordCells]
  )

  const solvedWordIds = useMemo(() => {
    const solved = new Set()
    puzzleData.forEach((word, index) => {
      const isSolved = getWordCells(word).every(
        ({ row, col }) => cellEntries[cellKey(row, col)]?.status === 'correct'
      )
      if (isSolved) solved.add(index)
    })
    return solved
  }, [cellEntries])

  const solvedCount = solvedWordIds.size

  useEffect(() => {
    // Depending on `solvedCount` (a primitive) rather than `solvedWordIds`
    // (a new Set instance every render) matters here: once the puzzle is
    // complete, any further re-render would otherwise still be seen as a
    // "changed" dependency, re-running this effect's cleanup and cancelling
    // the pending onComplete() timeout before it ever fires.
    if (hasCompletedRef.current || solvedCount !== TOTAL_WORDS) return

    hasCompletedRef.current = true

    const rainDurationMs = 5000
    const rainEndAt = Date.now() + rainDurationMs

    const fireBurst = () => {
      confetti({
        particleCount: 30,
        startVelocity: 25,
        spread: 100,
        ticks: 220,
        gravity: 0.8,
        origin: { x: Math.random(), y: -0.1 },
      })
    }

    // Fire the first burst immediately - setInterval alone would otherwise
    // wait a full tick before the very first piece of confetti appears,
    // making the celebration feel delayed right after the last letter.
    fireBurst()

    // Continue firing small bursts from random points just above the top
    // of the viewport on a steady interval so confetti keeps "raining"
    // down for the full duration, rather than a single burst.
    const rainInterval = setInterval(() => {
      fireBurst()

      if (Date.now() >= rainEndAt) {
        clearInterval(rainInterval)
      }
    }, 220)

    const timeoutId = setTimeout(() => {
      onComplete?.()
    }, rainDurationMs)

    return () => {
      clearInterval(rainInterval)
      clearTimeout(timeoutId)
    }
  }, [solvedCount, onComplete])

  const registerInputRef = (key, element) => {
    if (element) {
      inputRefs.current.set(key, element)
    } else {
      inputRefs.current.delete(key)
    }
  }

  // Deferring the focus call to the next animation frame avoids a subtle
  // race where calling .focus() synchronously inside the event that changed
  // React state could get fought over by the browser before the state
  // update finishes committing. It's purely cosmetic (keeps the visible
  // "cursor" input and the mobile keyboard in sync with the active cell) -
  // the actual letter routing below never depends on focus succeeding.
  const focusCell = (row, col) => {
    const element = inputRefs.current.get(cellKey(row, col))
    if (!element) return
    requestAnimationFrame(() => element.focus())
  }

  const handleCellSelect = (row, col) => {
    const wordsAtCell = cellIndex.get(cellKey(row, col))
    if (!wordsAtCell) return

    const hasAcross = Boolean(wordsAtCell.across)
    const hasDown = Boolean(wordsAtCell.down)
    const isSameCell = selection?.row === row && selection?.col === col

    if (isSameCell && hasAcross && hasDown) {
      setSelection({
        row,
        col,
        direction: selection.direction === 'across' ? 'down' : 'across',
      })
    } else if (!isSameCell) {
      setSelection({ row, col, direction: hasAcross ? 'across' : 'down' })
    }
  }

  const moveSelectionTo = (cell) => {
    if (!cell || !selection) return
    setSelection({ ...selection, row: cell.row, col: cell.col })
    focusCell(cell.row, cell.col)
  }

  const handleLetterInput = (row, col, rawChar) => {
    const letter = rawChar.slice(-1).toUpperCase()
    if (!/^[A-Z]$/.test(letter)) return

    const key = cellKey(row, col)
    const isCorrect = letterMap.get(key) === letter

    setCellEntries((prev) => ({
      ...prev,
      [key]: { letter, status: isCorrect ? 'correct' : 'incorrect' },
    }))

    if (!isCorrect) return

    const currentIndex = activeWordCells.findIndex(
      (c) => c.row === row && c.col === col
    )
    moveSelectionTo(activeWordCells[currentIndex + 1])
  }

  const handleBackspaceAtCell = (row, col) => {
    const key = cellKey(row, col)

    if (cellEntries[key]?.letter) {
      setCellEntries((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    const currentIndex = activeWordCells.findIndex(
      (c) => c.row === row && c.col === col
    )
    moveSelectionTo(activeWordCells[currentIndex - 1])
  }

  // All keystrokes bubble up here from whichever per-cell input is
  // currently focused. We deliberately ignore event.target and always act
  // on our own `selection` state instead - this is what makes typing
  // reliable regardless of any mobile-browser focus timing quirks.
  const handleGridKeyDown = (event) => {
    if (!selection) return

    if (event.key === 'Backspace') {
      event.preventDefault()
      handleBackspaceAtCell(selection.row, selection.col)
      return
    }

    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault()
      handleLetterInput(selection.row, selection.col, event.key)
    }
  }

  return (
    <div
      className="screen puzzle-screen"
      // Pinned to the *visual* viewport's real height (shrinks by exactly
      // the amount the on-screen keyboard covers). With `.puzzle-container`
      // and the clue card stacked as flex children of this fixed-height
      // column, the grid always resizes itself to fit whatever's left
      // above the card - so the whole puzzle is visible "zoomed out" at a
      // glance, and the two can never overlap or hide behind the keyboard.
      style={{ height: `${viewportHeight}px` }}
    >
      <div className="puzzle-container" ref={containerRef}>
        <CrosswordGrid
          grid={grid}
          selectedCell={selection}
          activeWordCellKeys={activeWordCellKeys}
          cellEntries={cellEntries}
          onCellSelect={handleCellSelect}
          onGridKeyDown={handleGridKeyDown}
          registerInputRef={registerInputRef}
          cellSize={cellSize}
        />
      </div>
      {activeWord && (
        <ClueCard word={activeWord} direction={selection.direction} cardRef={clueCardRef} />
      )}
    </div>
  )
}

export default PuzzleScreen
