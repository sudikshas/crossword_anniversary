function WelcomeScreen({ onBegin }) {
  return (
    <div className="screen welcome-screen">
      <div className="welcome-card">
        <span className="welcome-ornament" aria-hidden="true" />
        <h1 className="welcome-card-title">Ansh and Sudi's 3-Year Anniversary Crossword</h1>
        <p className="welcome-card-message">
          Here is a puzzle I made from memories and special moments between the both of us.
          Have fun solving it and going back down memory lane!
        </p>
        <button type="button" className="welcome-button" onClick={onBegin}>
          Begin Puzzle
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
