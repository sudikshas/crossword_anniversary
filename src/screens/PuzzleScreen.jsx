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
import CustomKeyboard from '../components/CustomKeyboard'

const TOTAL_WORDS = puzzleData.length

function PuzzleScreen({ onComplete }) {
  const grid = useMemo(() => buildGrid(puzzleData), [])
  const cellIndex = useMemo(() => buildCellIndex(puzzleData), [])
  const letterMap = useMemo(() => buildLetterMap(puzzleData), [])

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

  const solvedCount = solvedWordIds.size
  const progressPercent = Math.round((solvedCount / TOTAL_WORDS) * 100)

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
  }

  const handleLetterInput = (row, col, letter) => {
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

  // Both handlers below are the only place letters/backspace ever come
  // from - there is no native `<input>` anywhere in the puzzle, so
  // there's nothing for iOS to open a keyboard for or zoom into.
  const handleKeyboardLetter = (letter) => {
    if (!selection) return
    handleLetterInput(selection.row, selection.col, letter)
  }

  const handleKeyboardBackspace = () => {
    if (!selection) return
    handleBackspaceAtCell(selection.row, selection.col)
  }

  return (
    <div className="screen puzzle-screen">
      <div className="puzzle-header">
        <div className="puzzle-progress-track">
          <div
            className="puzzle-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="puzzle-scroll-area">
        <div className="puzzle-container">
          <CrosswordGrid
            grid={grid}
            selectedCell={selection}
            activeWordCellKeys={activeWordCellKeys}
            cellEntries={cellEntries}
            onCellSelect={handleCellSelect}
          />
        </div>
        {activeWord && (
          <ClueCard word={activeWord} direction={selection.direction} />
        )}
      </div>

      <CustomKeyboard
        onLetterPress={handleKeyboardLetter}
        onBackspace={handleKeyboardBackspace}
        disabled={!selection}
      />
    </div>
  )
}

export default PuzzleScreen
