// src/lib/utils.js
// This file provides the cn() utility for combining Tailwind CSS classes

export function cn(...classes) {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ');
}

export default cn;