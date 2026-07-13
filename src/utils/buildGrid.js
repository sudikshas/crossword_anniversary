export function buildGrid(words) {
  let maxRow = 0
  let maxCol = 0

  words.forEach(({ row, col, direction, answer }) => {
    const len = answer.length
    const endRow = direction === 'down' ? row + len - 1 : row
    const endCol = direction === 'across' ? col + len - 1 : col
    maxRow = Math.max(maxRow, endRow)
    maxCol = Math.max(maxCol, endCol)
  })

  const rowCount = maxRow + 1
  const colCount = maxCol + 1

  const grid = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ playable: false, number: null }))
  )

  words.forEach(({ row, col, direction, answer, clueNumber }) => {
    for (let i = 0; i < answer.length; i++) {
      const r = direction === 'down' ? row + i : row
      const c = direction === 'across' ? col + i : col
      const cell = grid[r][c]
      cell.playable = true
      if (i === 0 && cell.number == null) {
        cell.number = clueNumber
      }
    }
  })

  return grid
}
