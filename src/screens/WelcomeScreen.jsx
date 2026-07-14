function WelcomeScreen({ onBegin }) {
  return (
    <div className="screen welcome-screen">
      <div className="welcome-card">
        <span className="welcome-ornament" aria-hidden="true" />
        <h1 className="welcome-card-title">Our 3 Year Anniversary Crossword</h1>
        <p className="welcome-card-message">
          A little puzzle made from memories, inside jokes, and moments I
          love with you.
        </p>
        <button type="button" className="welcome-button" onClick={onBegin}>
          Begin Puzzle
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
