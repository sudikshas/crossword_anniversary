import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './HintModal.css'

// Rendered via a portal straight into `document.body`, completely
// outside the puzzle screen's DOM tree. Without this, `position: fixed`
// here would still (in some browsers, e.g. Safari) get trapped by an
// animated ancestor several levels up - which is exactly what caused the
// crossword grid and keyboard to show through/on top of the modal - since
// a "fixed" element is always positioned/stacked relative to whichever
// ancestor happens to establish a containing block for it, not
// necessarily the true viewport. A portal sidesteps that entirely: there
// simply are no puzzle-screen ancestors to get trapped by.
function HintModal({ src, alt, onClose }) {
  // Prevents the page behind the modal from scrolling while it's open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className="hint-modal-overlay" onClick={onClose}>
      <div className="hint-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="hint-modal-close"
          onClick={onClose}
          aria-label="Close hint"
        >
          ✕
        </button>
        <img className="hint-modal-image" src={src} alt={alt} />
      </div>
    </div>,
    document.body
  )
}

export default HintModal
