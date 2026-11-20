export function createContestantAvatar(
  name: string,
  primaryColor: string,
  accentColor: string,
  seedIndex = 0
): string {
  const skinTones = ['#f6d5b8', '#e9bc96', '#d9a176', '#f2cba9'];
  const hairTones = ['#1e1b18', '#2d1e18', '#422c20', '#111827'];
  const skin = skinTones[seedIndex % skinTones.length];
  const hair = hairTones[seedIndex % hairTones.length];
  const initial = (name.trim().charAt(0) || 'ก').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
      <radialGradient id="moon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="url(#bg)"/>
    <circle cx="155" cy="44" r="34" fill="url(#moon)"/>
    <circle cx="155" cy="44" r="16" fill="#fef9c3"/>
    <circle cx="32" cy="36" r="2" fill="#fde047" opacity="0.8"/>
    <circle cx="64" cy="24" r="1.5" fill="#ffffff" opacity="0.7"/>
    <circle cx="110" cy="30" r="2" fill="#fef08a" opacity="0.6"/>
    <path d="M40 200 C42 148 70 135 100 135 C130 135 158 148 160 200 Z" fill="${primaryColor}"/>
    <path d="M76 138 L100 158 L124 138" fill="none" stroke="${accentColor}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="100" cy="88" rx="34" ry="38" fill="${hair}"/>
    <circle cx="100" cy="96" r="28" fill="${skin}"/>
    <path d="M72 86 C76 62 124 62 128 86 C118 76 82 76 72 86 Z" fill="${hair}"/>
    <circle cx="89" cy="96" r="3.2" fill="#1f2937"/>
    <circle cx="111" cy="96" r="3.2" fill="#1f2937"/>
    <path d="M90 109 Q100 118 110 109" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
    <circle cx="80" cy="103" r="4" fill="#fb7185" opacity="0.45"/>
    <circle cx="120" cy="103" r="4" fill="#fb7185" opacity="0.45"/>
    <rect x="14" y="14" width="32" height="32" rx="10" fill="${accentColor}" opacity="0.92"/>
    <text x="30" y="36" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="18" fill="#0f172a">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
