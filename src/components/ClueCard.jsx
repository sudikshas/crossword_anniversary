import { useState } from 'react'
import './ClueCard.css'
import HintModal from './HintModal'
import { getHintImagePath } from '../utils/hintImage'

function ClueCard({ word, direction, cardRef }) {
  const [showHint, setShowHint] = useState(false)
  const hintImageSrc = getHintImagePath(word.hintImage)

  return (
    <div className="clue-card" ref={cardRef}>
      <div className="clue-card-header">
        <span className="clue-card-number">{word.clueNumber}</span>
        <span className="clue-card-direction">
          {direction === 'across' ? 'Across' : 'Down'}
        </span>
      </div>
      <p className="clue-card-text">{word.clue}</p>
      {hintImageSrc && (
        <button
          type="button"
          className="clue-card-hint-link"
          onClick={() => setShowHint(true)}
        >
          View picture hint
        </button>
      )}
      {showHint && (
        <HintModal
          src={hintImageSrc}
          alt="Picture hint"
          onClose={() => setShowHint(false)}
        />
      )}
    </div>
  )
}

export default ClueCard
