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
import { useKeyboardInset } from '../utils/useKeyboardInset'
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
  const [clueCardHeight, setClueCardHeight] = useState(0)

  const hasCompletedRef = useRef(false)
  const clueCardRef = useRef(null)
  const keyboardInset = useKeyboardInset()

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

  // Measure the clue card's real height so the grid's reserved bottom
  // space can match it exactly, instead of guessing a worst-case value.
  useEffect(() => {
    const element = clueCardRef.current
    if (!element) {
      setClueCardHeight(0)
      return
    }

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height
      if (height != null) setClueCardHeight(height)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [activeWord])

  // Whenever the selected cell changes (tap, auto-advance, or backspace
  // navigation) - or the keyboard finishes opening/closing while a cell
  // is already selected - bring that cell into a comfortable, visible
  // spot. The delay lets the keyboard animation (and the resulting
  // `keyboardInset` update) settle first, so we're scrolling against its
  // final position rather than a mid-animation one.
  useEffect(() => {
    if (!selection) return
    const cellElement = inputRefs.current.get(cellKey(selection.row, selection.col))
    if (!cellElement) return

    const timeoutId = setTimeout(() => {
      cellElement.scrollIntoView({ block: 'center', behavior: 'smooth' })

      // While the keyboard is closed, the clue card sits in normal flow
      // right below the grid rather than floating - if the selected cell
      // is near the top of a tall grid, centering just the cell could
      // still leave the card below the fold. `block: 'nearest'` nudges
      // just enough extra to bring it fully into view too, without
      // fighting the cell's own scroll position above.
      clueCardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 320)

    return () => clearTimeout(timeoutId)
  }, [selection?.row, selection?.col, keyboardInset])

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

  // A small threshold (rather than `keyboardInset > 0`) avoids the card
  // flickering between modes from tiny, meaningless fluctuations in
  // `visualViewport.height` (e.g. Safari's UI chrome nudging by a couple
  // of pixels) that aren't an actual keyboard.
  const isKeyboardOpen = keyboardInset > 40

  // While the keyboard is open, the card detaches from the page and
  // floats `keyboardInset` pixels above the true bottom of the screen so
  // it's never covered by it. The grid's reserved bottom space then
  // matches the card's real height plus that same inset, so scrolling to
  // the very bottom of the page never hides the grid's last row behind
  // the card or the keyboard. The rest of the time, the card just sits in
  // normal flow directly below the grid, so there's no dead gap.
  const reservedBottomSpace = activeWord && isKeyboardOpen
    ? (clueCardHeight || 150) + keyboardInset + 24
    : 24

  return (
    <div
      className="screen puzzle-screen"
      style={{ paddingBottom: `${reservedBottomSpace}px` }}
    >
      <div className="puzzle-container">
        <CrosswordGrid
          grid={grid}
          selectedCell={selection}
          activeWordCellKeys={activeWordCellKeys}
          cellEntries={cellEntries}
          onCellSelect={handleCellSelect}
          onGridKeyDown={handleGridKeyDown}
          registerInputRef={registerInputRef}
        />
      </div>
      {activeWord && (
        <ClueCard
          word={activeWord}
          direction={selection.direction}
          cardRef={clueCardRef}
          floating={isKeyboardOpen}
          style={isKeyboardOpen ? { bottom: `${keyboardInset}px` } : undefined}
        />
      )}
    </div>
  )
}

export default PuzzleScreen
