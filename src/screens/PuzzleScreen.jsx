import { useMemo, useRef, useState } from 'react'
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

function PuzzleScreen() {
  const grid = useMemo(() => buildGrid(puzzleData), [])
  const cellIndex = useMemo(() => buildCellIndex(puzzleData), [])
  const letterMap = useMemo(() => buildLetterMap(puzzleData), [])
  const inputRef = useRef(null)

  const [selection, setSelection] = useState(null)
  const [cellEntries, setCellEntries] = useState({})

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

  const handleCellTap = (row, col) => {
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

    inputRef.current?.focus()
  }

  const moveSelectionTo = (cell) => {
    if (!cell || !selection) return
    setSelection({ ...selection, row: cell.row, col: cell.col })
  }

  const handleLetterInput = (rawChar) => {
    if (!selection) return
    const letter = rawChar.toUpperCase()
    const key = cellKey(selection.row, selection.col)
    const isCorrect = letterMap.get(key) === letter

    setCellEntries((prev) => ({
      ...prev,
      [key]: { letter, status: isCorrect ? 'correct' : 'incorrect' },
    }))

    if (!isCorrect) return

    const currentIndex = activeWordCells.findIndex(
      (c) => c.row === selection.row && c.col === selection.col
    )
    moveSelectionTo(activeWordCells[currentIndex + 1])
  }

  const handleBackspace = () => {
    if (!selection) return
    const key = cellKey(selection.row, selection.col)

    if (cellEntries[key]?.letter) {
      setCellEntries((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    const currentIndex = activeWordCells.findIndex(
      (c) => c.row === selection.row && c.col === selection.col
    )
    moveSelectionTo(activeWordCells[currentIndex - 1])
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      handleBackspace()
    }
  }

  const handleChange = (event) => {
    const typedChar = event.target.value.slice(-1)
    event.target.value = ''
    if (/^[a-zA-Z]$/.test(typedChar)) {
      handleLetterInput(typedChar)
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
          onCellTap={handleCellTap}
        />
      </div>
      <input
        ref={inputRef}
        className="crossword-input-capture"
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck="false"
        aria-label="Crossword letter input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {activeWord && (
        <ClueCard word={activeWord} direction={selection.direction} />
      )}
    </div>
  )
}

export default PuzzleScreen
