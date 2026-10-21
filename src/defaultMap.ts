const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<rect width="1200" height="800" fill="#e8eef2"/>
<path d="M0 560 C200 500 300 640 520 600 S900 480 1200 560 V800 H0Z" fill="#cfe3ef"/>
<path d="M620 0 C660 200 560 300 640 480 S760 700 720 800" stroke="#fff" stroke-width="22" fill="none"/>
<path d="M0 260 H1200 M0 420 H1200 M300 0 V800 M900 0 V800" stroke="#fff" stroke-width="10"/>
<rect x="60" y="60" width="180" height="140" rx="16" fill="#d6e8d0"/>
<rect x="940" y="300" width="200" height="90" rx="16" fill="#d6e8d0"/>
</svg>`
export const DEFAULT_MAP = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
