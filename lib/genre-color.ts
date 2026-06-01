/** Deterministic color from a palette keyed on a string (genre, vibe, etc). */
export function genreColorFromPalette(
  tag: string,
  palette: { value: string }[],
): string {
  if (!palette?.length || !tag) return 'var(--color-accent)'
  let h = 0
  for (const ch of tag.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % palette.length
  return palette[h].value
}
