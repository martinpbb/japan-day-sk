/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useI18n } from "../lib/useI18n.js";

const TARGET_RATIO = 16 / 10;

function getAutomaticImageFit(image) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const cropSeverity = Math.max(TARGET_RATIO / imageRatio, imageRatio / TARGET_RATIO);
  return cropSeverity <= 1.33 ? "cover" : "contain";
}

export default function ImageWithFallback({ src, alt, className = "", style, autoFit = false, imageFit, onLoad, ...imgProps }) {
  const { site } = useI18n();
  const [failed, setFailed] = useState(false);
  const [automaticFit, setAutomaticFit] = useState("cover");
  if (!src || failed) {
    return <div className={`imageFallback ${className}`.trim()}><ImageIcon size={28}/><span>{site.ui.photoPending}</span></div>;
  }
  const resolvedFit = imageFit || (autoFit ? automaticFit : null);
  const fitClass = resolvedFit ? `imageFit--${resolvedFit}` : "";
  return <img {...imgProps} className={`${className} ${fitClass}`.trim()} src={src} alt={alt} style={style} loading="lazy" onLoad={(event) => {
    if (autoFit && !imageFit) setAutomaticFit(getAutomaticImageFit(event.currentTarget));
    onLoad?.(event);
  }} onError={() => setFailed(true)} />;
}
