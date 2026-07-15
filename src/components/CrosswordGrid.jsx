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
  cellSize,
}) {
  const rowCount = grid.length
  const colCount = grid[0]?.length ?? 0

  // `cellSize` (an exact pixel value, measured by PuzzleScreen from the
  // actual space left above the clue card) is what makes the grid "zoom
  // out" to fit entirely on screen. Without it - e.g. the read-only
  // puzzle recap on the completion screen, which has no keyboard or clue
  // card to make room for - the grid instead just sizes itself from the
  // available width, same as before.
  const style = cellSize
    ? {
        gridTemplateColumns: `repeat(${colCount}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rowCount}, ${cellSize}px)`,
        '--number-font-size': `${Math.max(4.5, Math.min(9, cellSize * 0.32))}px`,
        '--input-font-scale': Math.max(0.4, Math.min(1, (cellSize * 0.58) / 16)),
      }
    : { gridTemplateColumns: `repeat(${colCount}, 1fr)` }

  return (
    <div
      className={cellSize ? 'crossword-grid crossword-grid--fitted' : 'crossword-grid'}
      style={style}
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
