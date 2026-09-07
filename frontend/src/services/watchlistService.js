import api from './api.js'

export const watchlistService = {
  getStorageKey(userId) {
    return `sarangtv_watchlist_${userId || 'guest'}`
  },

  async getWatchlist(userId) {
    try {
      const response = await api.get('/watchlists')
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data
      }
    } catch {
      // Backend watchlist endpoint offline or not implemented yet
    }

    const storageKey = this.getStorageKey(userId)
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  },

  saveLocalWatchlist(userId, items) {
    const storageKey = this.getStorageKey(userId)
    localStorage.setItem(storageKey, JSON.stringify(items))
  },

  async addToWatchlist(userId, drama, status = 'Plan') {
    const itemData = {
      tmdb_id: drama.tmdb_id || drama.id,
      title: drama.title,
      native_title: drama.nativeTitle || drama.original_title || '',
      poster_url: drama.poster || drama.image,
      backdrop_url: drama.backdrop || drama.image,
      genres: Array.isArray(drama.genres) ? drama.genres : (drama.genres ? drama.genres.split(' · ') : []),
      release_year: drama.year || drama.release_year || 2025,
      total_episodes: drama.episodes || drama.number_of_episodes || 16,
      current_episode: status === 'Watching' ? 1 : 0,
      status: status,
      rating: drama.myRating || null,
      notes: drama.myNotes || '',
      is_favorite: false,
    }

    try {
      const response = await api.post('/watchlists', itemData)
      if (response.data && response.data.data) {
        return response.data.data
      }
    } catch {
      // Offline fallback
    }

    return itemData
  },

  async updateWatchlistItem(userId, itemId, updates) {
    try {
      const response = await api.patch(`/watchlists/${itemId}`, updates)
      if (response.data && response.data.data) {
        return response.data.data
      }
    } catch {
      // Offline fallback
    }
    return updates
  },

  async removeFromWatchlist(userId, itemId) {
    try {
      await api.delete(`/watchlists/${itemId}`)
    } catch {
      // Offline fallback
    }
    return true
  },
}

export default watchlistService