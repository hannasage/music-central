/**
 * Articles to ignore when sorting artist names
 */
const ARTICLES = ['THE', 'A', 'AN', 'LA', 'LE', 'LES', 'EL', 'LOS', 'LAS', 'DER', 'DIE', 'DAS']

/**
 * Normalize artist name for sorting by removing leading articles
 * @param artistName - The full artist name
 * @returns The artist name without leading articles for sorting purposes
 */
export function normalizeArtistForSorting(artistName: string): string {
  if (!artistName) return ''
  
  const trimmed = artistName.trim()
  const words = trimmed.split(/\s+/)
  
  if (words.length > 1) {
    const firstWord = words[0].toUpperCase()
    if (ARTICLES.includes(firstWord)) {
      // Return everything after the first word, preserving original case
      return words.slice(1).join(' ')
    }
  }
  
  return trimmed
}

/**
 * Compare two artist names for sorting, ignoring leading articles
 * @param a - First artist name
 * @param b - Second artist name
 * @returns Standard comparator result (-1, 0, 1)
 */
export function compareArtists(a: string, b: string): number {
  const normalizedA = normalizeArtistForSorting(a).toLowerCase()
  const normalizedB = normalizeArtistForSorting(b).toLowerCase()
  
  return normalizedA.localeCompare(normalizedB)
}

/**
 * Sort albums by artist name, ignoring leading articles
 * @param albums - Array of albums to sort
 * @returns Sorted array of albums
 */
export function sortAlbumsByArtist<T extends { artist: string }>(albums: T[]): T[] {
  return [...albums].sort((a, b) => compareArtists(a.artist, b.artist))
}