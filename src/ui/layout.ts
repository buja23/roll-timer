// Presentation only: the temporal plan and native clock remain unchanged.
export function formatDisplayTime(ms: number, duration = ms): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (duration >= 3600000 || seconds >= 3600) return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}
export function clockFontSize(width: number, height: number, text: string): number {
  // Bebas Neue Regular: every digit is 400/1000 em; colon is 188/1000 em.
  // Size depends on the format, never on the changing value of a digit.
  const units = clockWidthUnits(text);
  return Math.max(1, Math.floor(Math.min(Math.max(0, width * .94) / units, Math.max(0, height - 12) / .9)));
}
export function clockWidthUnits(text: string): number {
  return [...text].reduce((sum, c) => sum + (c === ':' ? .188 : .4), 0);
}
export function clockLayout(width: number, height: number, text: string) {
  const fontSize = clockFontSize(width, height, text);
  // Fit the sports display to its measured area. Bounded axis scaling makes
  // portrait digits taller and gives short landscape screens a broad clock.
  // The complete transformed line box remains inside the safe measured area.
  return { fontSize, scaleX: Math.max(1, Math.min(2.2, width * .94 / (fontSize * clockWidthUnits(text)))), scaleY: Math.max(1, Math.min(2.2, Math.max(0, height - 12) / (fontSize * .9))) };
}
