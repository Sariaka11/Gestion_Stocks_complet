import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-contenu">
        <div className="modal-entete">
          <h2>{title}</h2>
          <button className="modal-fermer" onClick={onClose}>×</button>
        </div>
        <div className="modal-corps">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
