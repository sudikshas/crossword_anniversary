import './CustomKeyboard.css'

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

// A plain, in-app QWERTY keyboard so crossword input never touches the
// native `<input>`/keyboard at all - see CrosswordGrid.jsx, whose cells
// are `<button>`s that can't trigger it either. Tapping a letter here is
// the only way letters ever get typed into the puzzle.
function CustomKeyboard({ onLetterPress, onBackspace, disabled }) {
  return (
    <div className="custom-keyboard" role="group" aria-label="Letter keyboard">
      {ROWS.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              className="keyboard-key"
              disabled={disabled}
              onClick={() => onLetterPress(letter)}
            >
              {letter}
            </button>
          ))}
          {rowIndex === ROWS.length - 1 && (
            <button
              type="button"
              className="keyboard-key keyboard-key--backspace"
              disabled={disabled}
              onClick={onBackspace}
              aria-label="Backspace"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default CustomKeyboard
