import './HintModal.css'

function HintModal({ src, alt, onClose }) {
  return (
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
    </div>
  )
}

export default HintModal
