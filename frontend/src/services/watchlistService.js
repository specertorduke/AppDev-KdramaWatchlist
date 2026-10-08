import api from './api.js'

export const watchlistService = {

  mapBackendToFrontend(backendItem) {
    if (!backendItem) return null;
    const drama = backendItem.drama || {};
    return {
      id: backendItem.id,
      tmdb_id: backendItem.tmdb_id,
      title: drama.title || drama.name || 'Unknown',
      native_title: drama.original_title || drama.original_name || '',
      poster_url: drama.poster_url || drama.poster_path || '',
      backdrop_url: drama.backdrop_url || drama.backdrop_path || '',
      genres: drama.genres || [],
      release_year: drama.release_year || drama.first_air_date ? parseInt(drama.first_air_date) : 2025,
      total_episodes: backendItem.total_episodes || drama.number_of_episodes || 16,
      current_episode: backendItem.current_episode || 0,
      status: backendItem.status || 'plan_to_watch',
      rating: backendItem.rating || null,
      notes: backendItem.review_notes || '',
      is_favorite: backendItem.is_favorite || false,
      tone: backendItem.status === 'watching' ? 'blue' : backendItem.status === 'completed' ? 'green' : backendItem.status === 'on_hold' ? 'orange' : 'purple',
    };
  },

  getStorageKey(userId) {
    return `sarangtv_watchlist_${userId || 'guest'}`
  },

  async getWatchlist(userId) {
    try {
      const response = await api.get('/tracker')
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => this.mapBackendToFrontend(item))
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

  async addToWatchlist(userId, drama, status = 'Plan to Watch') {
    const totalEpisodes = drama.episodes || drama.number_of_episodes || drama.total_episodes || 16
    const itemData = {
      tmdb_id: drama.tmdb_id || drama.id,
      title: drama.title,
      native_title: drama.nativeTitle || drama.original_title || '',
      poster_url: drama.poster || drama.image,
      backdrop_url: drama.backdrop || drama.image,
      genres: Array.isArray(drama.genres) ? drama.genres : (drama.genres ? drama.genres.split(' · ') : []),
      release_year: drama.year || drama.release_year || 2025,
      total_episodes: totalEpisodes,
      current_episode: status === 'Completed' ? totalEpisodes : (status === 'Watching' ? 1 : 0),
      status: typeof status === 'string' ? status.toLowerCase().replace(' ', '_').replace(' to ', '_to_') : 'plan_to_watch',
      rating: drama.myRating || null,
      notes: drama.myNotes || '',
      is_favorite: false,
    }

    try {
      const response = await api.post('/tracker', itemData)
      if (response.data && response.data.data) {
        return this.mapBackendToFrontend(response.data.data)
      }
    } catch {
      // Offline fallback
    }

    return itemData
  },

  async updateWatchlistItem(userId, itemId, updates) {
    try {
      const backendUpdates = { ...updates }
      if (backendUpdates.status && typeof backendUpdates.status === 'string') {
        backendUpdates.status = backendUpdates.status.toLowerCase().replace(' ', '_').replace(' to ', '_to_')
      }
      const response = await api.patch(`/tracker/${itemId}`, backendUpdates)
      if (response.data && response.data.data) {
        return this.mapBackendToFrontend(response.data.data)
      }
    } catch {
      // Offline fallback
    }
    return updates
  },

  async removeFromWatchlist(userId, itemId) {
    try {
      await api.delete(`/tracker/${itemId}`)
    } catch {
      // Offline fallback
    }
    return true
  },
}

export default watchlistService