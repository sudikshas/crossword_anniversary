import './ClueCard.css'

function ClueCard({ word, direction }) {
  return (
    <div className="clue-card">
      <div className="clue-card-header">
        <span className="clue-card-number">{word.clueNumber}</span>
        <span className="clue-card-direction">
          {direction === 'across' ? 'Across' : 'Down'}
        </span>
      </div>
      <p className="clue-card-text">{word.clue}</p>
    </div>
  )
}

export default ClueCard
