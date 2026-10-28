import React, { useEffect, useRef, useState } from 'react';

const EXIT_DURATION_MS = 200;

interface ModalPresenceProps {
  show: boolean;
  children: React.ReactNode;
}

// Mantiene el último contenido renderizado del modal durante la animación de salida.
export const ModalPresence: React.FC<ModalPresenceProps> = ({ show, children }) => {
  const lastChildren = useRef<React.ReactNode>(children);
  const [closing, setClosing] = useState(false);
  const wasShown = useRef(show);

  if (show) lastChildren.current = children;

  useEffect(() => {
    if (show) {
      wasShown.current = true;
      setClosing(false);
      return;
    }
    if (!wasShown.current) return;
    wasShown.current = false;
    setClosing(true);
    const timer = setTimeout(() => setClosing(false), EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [show]);

  const isClosing = closing || (!show && wasShown.current);

  return (
    <div className="contents" data-modal-state={isClosing ? 'closing' : 'open'}>
      {isClosing ? lastChildren.current : children}
    </div>
  );
};
