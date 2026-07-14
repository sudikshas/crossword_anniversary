export function cellKey(row, col) {
  return `${row},${col}`
}

export function getWordCells(word) {
  const cells = []
  for (let i = 0; i < word.answer.length; i++) {
    const row = word.direction === 'down' ? word.row + i : word.row
    const col = word.direction === 'across' ? word.col + i : word.col
    cells.push({ row, col })
  }
  return cells
}

export function buildCellIndex(words) {
  const index = new Map()

  words.forEach((word) => {
    getWordCells(word).forEach(({ row, col }) => {
      const key = cellKey(row, col)
      const entry = index.get(key) ?? {}
      entry[word.direction] = word
      index.set(key, entry)
    })
  })

  return index
}

export function buildLetterMap(words) {
  const map = new Map()

  words.forEach((word) => {
    getWordCells(word).forEach(({ row, col }, i) => {
      map.set(cellKey(row, col), word.answer[i].toUpperCase())
    })
  })

  return map
}
