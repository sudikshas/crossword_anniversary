function WelcomeScreen({ onBegin }) {
  return (
    <div className="screen welcome-screen">
      <div className="card">
        <h1 className="card-title">Our 3 Year Anniversary Crossword</h1>
        <p className="card-message">
          A little puzzle made from memories, inside jokes, and moments I
          love with you.
        </p>
        <button type="button" className="primary-button" onClick={onBegin}>
          Begin Puzzle
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
