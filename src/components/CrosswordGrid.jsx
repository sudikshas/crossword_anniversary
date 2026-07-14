import './CrosswordGrid.css'
import { cellKey } from '../utils/wordIndex'

function CrosswordGrid({
  grid,
  selectedCell,
  activeWordCellKeys,
  cellEntries,
  onCellSelect,
  onGridKeyDown,
  registerInputRef,
}) {
  const colCount = grid[0]?.length ?? 0

  return (
    <div
      className="crossword-grid"
      style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
      onKeyDown={onGridKeyDown}
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
            <div key={key} className={classNames.join(' ')}>
              {cell.number != null && (
                <span className="grid-cell-number">{cell.number}</span>
              )}
              <input
                ref={(el) => registerInputRef(key, el)}
                className="grid-cell-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                aria-label={`Crossword cell row ${rowIndex + 1}, column ${colIndex + 1}`}
                value={entry?.letter ?? ''}
                onClick={() => onCellSelect(rowIndex, colIndex)}
                onChange={(event) => {
                  // Letters/backspace are handled by the grid-level key
                  // handler using our own selection state, which is far more
                  // reliable across mobile keyboards than trusting whichever
                  // input the browser currently has focused. If a keystroke
                  // ever slips past preventDefault, snap the DOM back to the
                  // canonical value instead of letting it drift out of sync.
                  event.target.value = entry?.letter ?? ''
                }}
              />
              {entry?.status === 'incorrect' && (
                <span className="grid-cell-incorrect-mark">✕</span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default CrosswordGrid
