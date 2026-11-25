/**
 * Generates original poster (2:3) and backdrop (16:9) artwork as SVG for the demo catalogue,
 * so the seed ships no third-party images. Administrators replace these with real artwork.
 */
type Art = { title: string; year: number; credit?: string; hue: number; motif: number };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function wrap(title: string, max: number) {
  const words = title.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function motif(kind: number, w: number, h: number, hue: number) {
  const a = `hsl(${hue} 85% 68%)`;
  const b = `hsl(${(hue + 40) % 360} 80% 55%)`;
  const cx = w * 0.62;
  const cy = h * 0.36;
  switch (kind % 6) {
    case 0: // eclipse
      return `<circle cx="${cx}" cy="${cy}" r="${w * 0.24}" fill="${a}" opacity=".9"/><circle cx="${cx + w * 0.05}" cy="${cy - w * 0.03}" r="${w * 0.235}" fill="url(#bg)"/>`;
    case 1: // concentric rings
      return Array.from({ length: 9 }, (_, i) => `<circle cx="${w * 0.3}" cy="${cy}" r="${w * 0.08 + i * w * 0.07}" fill="none" stroke="${a}" stroke-opacity="${0.75 - i * 0.07}" stroke-width="${2 + (i % 3)}"/>`).join("");
    case 2: // light beams
      return Array.from({ length: 6 }, (_, i) => `<polygon points="${w * 0.5},${-h * 0.05} ${w * (0.05 + i * 0.17)},${h} ${w * (0.13 + i * 0.17)},${h}" fill="${i % 2 ? a : b}" opacity="${0.1 + (i % 3) * 0.05}"/>`).join("");
    case 3: // horizon + sun bands
      return `<circle cx="${w * 0.5}" cy="${h * 0.55}" r="${w * 0.3}" fill="${a}"/>` +
        Array.from({ length: 7 }, (_, i) => `<rect x="0" y="${h * 0.5 + i * h * 0.03}" width="${w}" height="${h * 0.012 + i * 1.5}" fill="url(#bg)"/>`).join("") +
        `<rect x="0" y="${h * 0.62}" width="${w}" height="${h}" fill="url(#bg)"/>`;
    case 4: // perspective grid
      return Array.from({ length: 13 }, (_, i) => `<line x1="${w * 0.5}" y1="${h * 0.45}" x2="${(i / 12) * w * 2 - w * 0.5}" y2="${h}" stroke="${a}" stroke-opacity=".35"/>`).join("") +
        Array.from({ length: 8 }, (_, i) => { const y = h * 0.45 + Math.pow(i / 7, 2) * h * 0.55; return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${a}" stroke-opacity=".3"/>`; }).join("") +
        `<circle cx="${w * 0.5}" cy="${h * 0.42}" r="${w * 0.12}" fill="${b}" opacity=".85"/>`;
    default: // shards
      return Array.from({ length: 7 }, (_, i) => {
        const x = (i * 137) % w;
        const y = (i * 211) % (h * 0.7);
        return `<polygon points="${x},${y} ${x + w * 0.25},${y + h * 0.08} ${x + w * 0.08},${y + h * 0.3}" fill="${i % 2 ? a : b}" opacity="${0.18 + (i % 4) * 0.08}"/>`;
      }).join("");
  }
}

function defs(hue: number, w: number, h: number) {
  return `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="hsl(${(hue + 200) % 360} 45% 7%)"/><stop offset="1" stop-color="hsl(${hue} 55% 16%)"/></linearGradient>
<radialGradient id="glow" cx=".65" cy=".3" r=".7"><stop offset="0" stop-color="hsl(${hue} 90% 60%)" stop-opacity=".45"/><stop offset="1" stop-color="hsl(${hue} 90% 60%)" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#090909" stop-opacity="0"/><stop offset="1" stop-color="#090909" stop-opacity=".92"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>
</defs><rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#glow)"/>`;
}

export function posterSvg({ title, year, credit, hue, motif: m }: Art) {
  const w = 600, h = 900;
  const lines = wrap(title, 12);
  const size = lines.some((l) => l.length > 9) ? 62 : 76;
  const startY = h - 120 - (lines.length - 1) * size * 0.98;
  const text = lines.map((l, i) => `<text x="44" y="${startY + i * size * 0.98}" font-size="${size}">${esc(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs(hue, w, h)}
${motif(m, w, h, hue)}<rect width="${w}" height="${h}" fill="url(#fade)"/>
<g font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" font-weight="800" fill="#fff" letter-spacing="-1">${text}</g>
<text x="46" y="${h - 62}" font-family="Helvetica,Arial,sans-serif" font-size="20" letter-spacing="5" fill="hsl(${hue} 80% 78%)">${year}${credit ? " · " + esc(credit.toUpperCase()) : ""}</text>
<rect width="${w}" height="${h}" filter="url(#grain)"/></svg>`;
}

export function backdropSvg({ hue, motif: m }: Art) {
  const w = 1920, h = 1080;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs(hue, w, h)}
<g transform="translate(${w * 0.25} 0) scale(.75 1)">${motif(m, w, h, hue)}</g>
<rect width="${w}" height="${h}" filter="url(#grain)"/></svg>`;
}
