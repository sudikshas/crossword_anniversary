import './CrosswordGrid.css'
import { cellKey } from '../utils/wordIndex'

// Cells are plain `<button>` elements, never `<input>` - buttons can't
// trigger the native iOS keyboard no matter how they're tapped/focused,
// which is what makes tapping a cell only ever select it (letters come
// from the custom on-screen keyboard in PuzzleScreen instead).
function CrosswordGrid({
  grid,
  selectedCell,
  activeWordCellKeys,
  cellEntries,
  onCellSelect,
}) {
  const colCount = grid[0]?.length ?? 0

  return (
    <div
      className="crossword-grid"
      style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
    >
      {grid.map((rowCells, rowIndex) =>
        rowCells.map((cell, colIndex) => {
          const key = cellKey(rowIndex, colIndex)

          if (!cell.playable) {
            return <div key={key} className="grid-cell grid-cell--empty" />
          }

          const isSelected =
            selectedCell?.row === rowIndex && selectedCell?.col === colIndex
          const isActiveWord = activeWordCellKeys.has(key)
          const entry = cellEntries[key]

          const classNames = ['grid-cell']
          if (isActiveWord) classNames.push('grid-cell--active-word')
          if (isSelected) classNames.push('grid-cell--selected')
          if (entry?.status === 'incorrect') {
            classNames.push('grid-cell--incorrect')
          }

          return (
            <button
              key={key}
              type="button"
              className={classNames.join(' ')}
              onClick={() => onCellSelect(rowIndex, colIndex)}
              aria-label={`Crossword cell row ${rowIndex + 1}, column ${colIndex + 1}${
                entry?.letter ? `, letter ${entry.letter}` : ''
              }`}
            >
              {cell.number != null && (
                <span className="grid-cell-number">{cell.number}</span>
              )}
              <span className="grid-cell-letter">{entry?.letter ?? ''}</span>
              {entry?.status === 'incorrect' && (
                <span className="grid-cell-incorrect-mark">✕</span>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}

export default CrosswordGrid
