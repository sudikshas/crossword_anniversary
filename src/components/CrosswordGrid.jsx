import './CrosswordGrid.css'

function CrosswordGrid({ grid }) {
  const colCount = grid[0]?.length ?? 0

  return (
    <div
      className="crossword-grid"
      style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
    >
      {grid.map((rowCells, rowIndex) =>
        rowCells.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={
              cell.playable ? 'grid-cell' : 'grid-cell grid-cell--empty'
            }
          >
            {cell.playable && cell.number != null && (
              <span className="grid-cell-number">{cell.number}</span>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default CrosswordGrid
