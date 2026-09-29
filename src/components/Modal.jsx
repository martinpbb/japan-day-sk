/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../lib/useI18n.js";

export default function Modal({ open, onClose, children }) {
  const { site } = useI18n();
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modalBackdrop" role="presentation" onClick={onClose}>
      <div className="modalPanel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modalClose" onClick={onClose} aria-label={site.ui.closePhoto}>×</button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
