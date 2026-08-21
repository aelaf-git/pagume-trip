export function placeholderImage(label, bg = "#0f9d58") {
  const text = encodeURIComponent(label.slice(0, 3).toUpperCase());
  const encodedLabel = encodeURIComponent(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">
    <rect width="480" height="320" fill="${bg}"/>
    <text x="240" y="150" font-family="Arial, sans-serif" font-size="64" fill="#ffffff" text-anchor="middle" font-weight="bold">${text}</text>
    <text x="240" y="200" font-family="Arial, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle">${encodedLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}
