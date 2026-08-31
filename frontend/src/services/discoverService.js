import api from './api.js'

export const DEFAULT_POSTER_IMAGE =
  'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=600&q=85'

export const DEFAULT_BACKDROP_IMAGE =
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=85'

const TONES = ['pink', 'purple', 'blue', 'orange']

/**
 * Standardize backend DramaCardResource items into component-ready objects.
 */
export function mapDramaCard(item, index = 0) {
  if (!item) return null

  const rankNum = item.rank || index + 1
  const tone = TONES[(rankNum - 1) % TONES.length]
  const image = item.poster_url || item.backdrop_url || DEFAULT_POSTER_IMAGE
  const releaseYear = item.release_year || '2025'
  const genresList = Array.isArray(item.genres) ? item.genres : []
  const genreMeta = genresList.slice(0, 2).join(' · ') || 'K-Drama'

  return {
    id: item.tmdb_id || item.id || `drama-${index}`,
    tmdb_id: item.tmdb_id || item.id,
    rank: `TOP ${rankNum}`,
    rankNumber: rankNum,
    weekHighlight: `#${rankNum} THIS WEEK`,
    title: item.title || 'Untitled Drama',
    nativeTitle: item.original_title || item.title || '',
    year: releaseYear,
    meta: `${genreMeta} · ${releaseYear}`,
    rating: item.rating ? Number(item.rating).toFixed(1) : '9.0',
    tone,
    image,
    poster: image,
    backdrop: item.backdrop_url || image,
    genres: genresList,
    overview: item.overview || '',
    status: item.watch_status || null,
  }
}

/**
 * Standardize backend DramaDetailResource items into full detail objects.
 */
export function mapDramaDetail(item) {
  if (!item) return null

  const tmdbId = item.tmdb_id || item.id
  const image = item.backdrop_url || item.poster_url || DEFAULT_BACKDROP_IMAGE
  const poster = item.poster_url || item.backdrop_url || DEFAULT_POSTER_IMAGE
  const totalEps = item.number_of_episodes || 16
  const genresList = Array.isArray(item.genres) ? item.genres : []
  const genresString = genresList.length > 0 ? genresList.join(' · ') : 'Romance · Drama'
  const releaseYear = item.release_year || 2025
  const rating = item.rating ? Number(item.rating).toFixed(1) : '9.0'

  // Generate dynamic episode checklist items matching total episodes count (up to 32)
  const epCount = Math.min(Math.max(totalEps, 1), 32)
  const episodeList = Array.from({ length: epCount }, (_, i) => ({
    number: i + 1,
    title: `Episode ${i + 1}`,
    watched: i === 0, // Default first episode watched
  }))

  return {
    id: tmdbId,
    tmdb_id: tmdbId,
    rank: 1,
    rankBadge: 'TOP 1',
    title: item.title || 'Untitled Drama',
    nativeTitle: item.original_title || item.title || '',
    year: releaseYear,
    network: 'tvN · Netflix',
    episodes: totalEps,
    duration: '60–70 min / ep',
    rating,
    myRating: 9,
    status: item.watch_status || 'Watching',
    progress: Math.round((1 / epCount) * 100),
    watchedCount: 1,
    addedDate: 'Aug 2025',
    remainingTime: `~${Math.max(1, epCount - 1)}h remaining`,
    tone: 'pink',
    image,
    poster,
    genres: genresString,
    director: 'Director',
    availableOn: 'tvN, Netflix, Viki',
    synopsis:
      item.overview ||
      'An acclaimed Korean drama series featuring compelling storytelling, memorable characters, and emotional twists.',
    myNotes: 'Added from K-Drama catalog!',
    cast: [
      {
        name: 'Lead Actor',
        role: 'Main Character',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
      },
      {
        name: 'Lead Actress',
        role: 'Main Character',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
      },
    ],
    trailer: item.trailer || null,
    episodeList,
  }
}

export const discoverService = {
  /**
   * Browse K-dramas with optional genre and pagination.
   */
  async getDiscover({ page = 1, genre_id = null } = {}) {
    const params = { page }
    if (genre_id) {
      params.genre_id = genre_id
    }
    const response = await api.get('/discover', { params })
    return response.data
  },

  /**
   * Fetch TV genre list.
   */
  async getGenres() {
    const response = await api.get('/discover/genres')
    return response.data
  },

  /**
   * Search K-dramas by title, actor, or keyword.
   */
  async searchDramas({ query, page = 1 }) {
    const response = await api.get('/discover/search', {
      params: { query, page },
    })
    return response.data
  },

  /**
   * Fetch detailed drama information by TMDB ID.
   */
  async getDramaDetails(tmdbId) {
    const response = await api.get(`/discover/${tmdbId}`)
    return response.data
  },
}

export default discoverService

