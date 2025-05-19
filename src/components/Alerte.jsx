import React, { useEffect } from 'react';
import './Alerte.css';

const Alerte = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`alerte-flottante alerte-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="alerte-fermer">×</button>
    </div>
  );
};

export default Alerte;
