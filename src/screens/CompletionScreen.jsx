import { useMemo, useState } from 'react'
import puzzleData from '../data/puzzle_data.json'
import { memoryPhotos } from '../data/memoryPhotos'
import { buildGrid } from '../utils/buildGrid'
import { buildSolvedEntries } from '../utils/wordIndex'
import CrosswordGrid from '../components/CrosswordGrid'
import HintModal from '../components/HintModal'

const EMPTY_SET = new Set()
const noop = () => {}

function CompletionScreen() {
  const [activePhoto, setActivePhoto] = useState(null)
  const [showPuzzle, setShowPuzzle] = useState(false)

  const grid = useMemo(() => buildGrid(puzzleData), [])
  const solvedEntries = useMemo(() => buildSolvedEntries(puzzleData), [])

  if (showPuzzle) {
    return (
      <div className="screen completion-screen completion-screen--puzzle-view">
        <div className="completion-content">
          <button
            type="button"
            className="completion-back-button"
            onClick={() => setShowPuzzle(false)}
          >
            ← Back
          </button>
          <div className="puzzle-container puzzle-container--review">
            <CrosswordGrid
              grid={grid}
              selectedCell={null}
              activeWordCellKeys={EMPTY_SET}
              cellEntries={solvedEntries}
              onCellSelect={noop}
              onGridKeyDown={noop}
              registerInputRef={noop}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen completion-screen">
      <div className="completion-content">
        <span className="welcome-ornament" aria-hidden="true" />
        <h1 className="completion-title">You finished the puzzle! ❤️</h1>
        <p className="completion-message">
          Congrats on solving our 3-year anniversary crossword! I loved
          looking back at all these memories with you, and I’m so excited to
          keep making many more. Thank you for making me feel so special,
          happy, loved, and supported. I love you so much Ansh Shah! Happy 3
          years my love!
        </p>

        <button
          type="button"
          className="welcome-button completion-view-puzzle-button"
          onClick={() => setShowPuzzle(true)}
        >
          View Completed Puzzle
        </button>

        <div className="memory-gallery">
          {memoryPhotos.map((src, index) => (
            <button
              key={src}
              type="button"
              className={`memory-photo memory-photo--tilt-${index % 4}`}
              onClick={() => setActivePhoto(src)}
              aria-label="View memory photo larger"
            >
              <img
                className="memory-photo-image"
                src={src}
                alt="A memory we shared together"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {activePhoto && (
        <HintModal
          src={activePhoto}
          alt="A memory we shared together"
          onClose={() => setActivePhoto(null)}
        />
      )}
    </div>
  )
}

export default CompletionScreen
