import { useMemo } from 'react'
import puzzleData from '../data/puzzle_data.json'
import { buildGrid } from '../utils/buildGrid'
import CrosswordGrid from '../components/CrosswordGrid'

function PuzzleScreen() {
  const grid = useMemo(() => buildGrid(puzzleData), [])

  return (
    <div className="screen puzzle-screen">
      <div className="puzzle-container">
        <CrosswordGrid grid={grid} />
      </div>
    </div>
  )
}

export default PuzzleScreen
