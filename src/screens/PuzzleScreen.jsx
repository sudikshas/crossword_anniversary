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

  const hasCompletedRef = useRef(false)

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

  useEffect(() => {
    if (hasCompletedRef.current || solvedWordIds.size !== TOTAL_WORDS) return

    hasCompletedRef.current = true
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })

    const timeoutId = setTimeout(() => {
      onComplete?.()
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [solvedWordIds, onComplete])

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
    <div className="screen puzzle-screen">
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
        <ClueCard word={activeWord} direction={selection.direction} />
      )}
    </div>
  )
}

export default PuzzleScreen
