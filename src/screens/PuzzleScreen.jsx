import { useMemo, useState } from 'react'
import puzzleData from '../data/puzzle_data.json'
import { buildGrid } from '../utils/buildGrid'
import { buildCellIndex, cellKey, getWordCells } from '../utils/wordIndex'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueCard from '../components/ClueCard'

function PuzzleScreen() {
  const grid = useMemo(() => buildGrid(puzzleData), [])
  const cellIndex = useMemo(() => buildCellIndex(puzzleData), [])
  const [selection, setSelection] = useState(null)

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
      return
    }

    if (isSameCell) {
      // Only one direction available at this cell, so there is nothing to switch to.
      return
    }

    setSelection({ row, col, direction: hasAcross ? 'across' : 'down' })
  }

  const activeWord = selection
    ? cellIndex.get(cellKey(selection.row, selection.col))?.[selection.direction]
    : null

  const activeWordCellKeys = useMemo(() => {
    if (!activeWord) return new Set()
    return new Set(
      getWordCells(activeWord).map(({ row, col }) => cellKey(row, col))
    )
  }, [activeWord])

  return (
    <div className="screen puzzle-screen">
      <div className="puzzle-container">
        <CrosswordGrid
          grid={grid}
          selectedCell={selection}
          activeWordCellKeys={activeWordCellKeys}
          onCellTap={handleCellTap}
        />
      </div>
      {activeWord && (
        <ClueCard word={activeWord} direction={selection.direction} />
      )}
    </div>
  )
}

export default PuzzleScreen
