import './CrosswordGrid.css'
import { cellKey } from '../utils/wordIndex'

function CrosswordGrid({
  grid,
  selectedCell,
  activeWordCellKeys,
  cellEntries,
  onCellSelect,
  onLetterInput,
  onBackspaceOnEmpty,
  registerInputRef,
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
                onFocus={(event) => event.target.select()}
                onChange={(event) => {
                  onLetterInput(rowIndex, colIndex, event.target.value)
                  event.target.select()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !entry?.letter) {
                    event.preventDefault()
                    onBackspaceOnEmpty(rowIndex, colIndex)
                  }
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
