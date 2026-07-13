import './CrosswordGrid.css'
import { cellKey } from '../utils/wordIndex'

function CrosswordGrid({ grid, selectedCell, activeWordCellKeys, onCellTap }) {
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
            return (
              <div key={key} className="grid-cell grid-cell--empty" />
            )
          }

          const isSelected =
            selectedCell?.row === rowIndex && selectedCell?.col === colIndex
          const isActiveWord = activeWordCellKeys.has(key)

          const classNames = ['grid-cell']
          if (isActiveWord) classNames.push('grid-cell--active-word')
          if (isSelected) classNames.push('grid-cell--selected')

          return (
            <button
              type="button"
              key={key}
              className={classNames.join(' ')}
              onClick={() => onCellTap(rowIndex, colIndex)}
            >
              {cell.number != null && (
                <span className="grid-cell-number">{cell.number}</span>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}

export default CrosswordGrid
