/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";

export default function ContentRenderer({ content }) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className="richContent">
      {content.map((block, index) => {
        if (!block || typeof block !== "object") return null;
        const key = `${block.type || "block"}-${index}`;
        const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];

        if (block.type === "p" && block.text) return <p key={key}>{block.text}</p>;
        if (block.type === "h2" && block.text) return <h2 key={key}>{block.text}</h2>;
        if (block.type === "h3" && block.text) return <h3 key={key}>{block.text}</h3>;
        if ((block.type === "ul" || block.type === "ol") && items.length > 0) {
          const List = block.type;
          return <List key={key}>{items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{item}</li>)}</List>;
        }
        if (block.type === "quote" && block.text) return <blockquote key={key}>{block.text}</blockquote>;
        return null;
      })}
    </div>
  );
}
