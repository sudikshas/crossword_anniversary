import { useState } from 'react'
import WelcomeScreen from './screens/WelcomeScreen'
import PuzzleScreen from './screens/PuzzleScreen'
import CompletionScreen from './screens/CompletionScreen'
import './App.css'

const SCREEN = {
  WELCOME: 'welcome',
  PUZZLE: 'puzzle',
  COMPLETION: 'completion',
}

function App() {
  const [screen, setScreen] = useState(SCREEN.WELCOME)

  return (
    <div className="app-shell">
      {screen === SCREEN.WELCOME && (
        <WelcomeScreen onBegin={() => setScreen(SCREEN.PUZZLE)} />
      )}
      {screen === SCREEN.PUZZLE && (
        <PuzzleScreen onComplete={() => setScreen(SCREEN.COMPLETION)} />
      )}
      {screen === SCREEN.COMPLETION && <CompletionScreen />}
    </div>
  )
}

export default App
