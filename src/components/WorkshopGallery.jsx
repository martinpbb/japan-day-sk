import React, { useState } from "react";
import { workshopImages } from "../data/workshopImages.js";

export default function WorkshopGallery({ slug }) {
  const images = workshopImages[slug] || [];
  const [failedImages, setFailedImages] = useState([]);
  const visibleImages = images.filter((_, index) => !failedImages.includes(index));

  if (!visibleImages.length) return null;

  return <div className="workshopGallery" aria-label="Fotogaléria workshopu">
    {images.map((image, index) => failedImages.includes(index) ? null : <img
      className="workshopGalleryImage"
      key={image.src}
      src={image.src}
      alt={image.alt}
      width="640"
      height="420"
      loading={index === 0 ? "eager" : "lazy"}
      fetchPriority={index === 0 ? "high" : "auto"}
      onError={() => setFailedImages((failed) => [...failed, index])}
    />)}
  </div>;
}
