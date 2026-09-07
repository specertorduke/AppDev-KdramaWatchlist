import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import watchlistService from '../services/watchlistService.js'

const WatchlistContext = createContext(null)

export function WatchlistProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id || user?.email || 'guest'
  const [watchlist, setWatchlist] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    async function loadUserWatchlist() {
      const items = await watchlistService.getWatchlist(userId)
      if (isMounted) {
        setWatchlist(items)
        setIsLoading(false)
      }
    }

    loadUserWatchlist()

    return () => {
      isMounted = false
    }
  }, [userId])

  const getActivityStorageKey = (uid) => `sarangtv_activity_${uid || 'guest'}`

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(`sarangtv_activity_${userId}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sarangtv_activity_${userId}`)
      setActivities(saved ? JSON.parse(saved) : [])
    } catch {
      setActivities([])
    }
  }, [userId])

  const logActivity = (event) => {
    const newActivity = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      ...event,
    }
    setActivities((prev) => {
      const updated = [newActivity, ...prev].slice(0, 50)
      try {
        localStorage.setItem(getActivityStorageKey(userId), JSON.stringify(updated))
      } catch {
        // Storage full
      }
      return updated
    })
  }

  const saveItems = (newItems) => {
    setWatchlist(newItems)
    watchlistService.saveLocalWatchlist(userId, newItems)
  }

  const addToWatchlist = async (drama, status = 'Plan') => {
    const dramaId = drama.tmdb_id || drama.id
    const existingIndex = watchlist.findIndex(
      (item) => (item.tmdb_id || item.id) === dramaId || item.title?.toLowerCase() === drama.title?.toLowerCase()
    )

    if (existingIndex >= 0) {
      const updated = [...watchlist]
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
      }
      saveItems(updated)
      watchlistService.updateWatchlistItem(userId, updated[existingIndex].id, { status })
      logActivity({
        dramaId,
        title: updated[existingIndex].title,
        poster: updated[existingIndex].poster || updated[existingIndex].image,
        status,
        action: `Moved to ${status}`,
        rating: updated[existingIndex].rating,
      })
      return updated[existingIndex]
    }

    const totalEps = drama.episodes || drama.total_episodes || drama.number_of_episodes || 16
    const curEp = status === 'Watching' ? 1 : status === 'Completed' ? totalEps : 0
    const progress = totalEps > 0 ? Math.round((curEp / totalEps) * 100) : 0

    const newItem = {
      id: Date.now(),
      tmdb_id: drama.tmdb_id || drama.id,
      title: drama.title,
      nativeTitle: drama.nativeTitle || drama.original_title || '',
      image: drama.poster || drama.image || drama.poster_url,
      poster: drama.poster || drama.image || drama.poster_url,
      backdrop: drama.backdrop || drama.backdrop_url || drama.image,
      genres: Array.isArray(drama.genres) ? drama.genres : (drama.genres ? drama.genres.split(' · ') : ['Drama']),
      year: drama.year || drama.release_year || 2025,
      episodes: totalEps,
      current_episode: curEp,
      watchedCount: curEp,
      progress,
      status,
      tone: status === 'Watching' ? 'blue' : status === 'Completed' ? 'green' : status === 'On Hold' ? 'orange' : 'purple',
      meta: `${(Array.isArray(drama.genres) ? drama.genres : []).slice(0, 2).join(' · ') || 'Drama'} · ${drama.year || 2025}`,
      rating: drama.myRating || drama.rating || null,
      notes: drama.myNotes || '',
      is_favorite: false,
      addedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      logged: 'Just now',
    }

    const updatedList = [newItem, ...watchlist]
    saveItems(updatedList)
    watchlistService.addToWatchlist(userId, newItem, status)
    logActivity({
      dramaId: newItem.tmdb_id || newItem.id,
      title: newItem.title,
      poster: newItem.poster || newItem.image,
      status,
      action: status === 'Completed' ? 'Completed drama' : `Added to ${status}`,
      rating: newItem.rating,
    })
    return newItem
  }

  const updateWatchlist = async (dramaId, updates) => {
    let affectedItem = null
    const updatedList = watchlist.map((item) => {
      if ((item.tmdb_id || item.id) === dramaId || item.id === dramaId) {
        const totalEps = updates.episodes || item.episodes || 16
        const curEp = typeof updates.current_episode === 'number'
          ? updates.current_episode
          : (typeof updates.watchedCount === 'number' ? updates.watchedCount : item.current_episode || 0)
        const progress = totalEps > 0 ? Math.round((curEp / totalEps) * 100) : 0
        const newStatus = updates.status || item.status || 'Watching'

        const updatedItem = {
          ...item,
          ...updates,
          current_episode: curEp,
          watchedCount: curEp,
          progress,
          status: newStatus,
          tone: newStatus === 'Watching' ? 'blue' : newStatus === 'Completed' ? 'green' : newStatus === 'On Hold' ? 'orange' : 'purple',
          logged: 'Today',
        }
        affectedItem = updatedItem
        return updatedItem
      }
      return item
    })

    saveItems(updatedList)
    watchlistService.updateWatchlistItem(userId, dramaId, updates)

    if (affectedItem) {
      let actionDesc = 'Updated drama'
      if (updates.status && updates.status === 'Completed') {
        actionDesc = `Completed all ${affectedItem.episodes || 16} episodes`
      } else if (updates.status) {
        actionDesc = `Changed status to ${updates.status}`
      } else if (typeof updates.watchedCount === 'number' || typeof updates.current_episode === 'number') {
        actionDesc = `Watched Ep ${affectedItem.current_episode} of ${affectedItem.episodes || 16}`
      } else if (updates.rating) {
        actionDesc = `Rated ★ ${updates.rating}`
      }
      logActivity({
        dramaId: affectedItem.tmdb_id || affectedItem.id,
        title: affectedItem.title,
        poster: affectedItem.poster || affectedItem.image,
        status: affectedItem.status,
        action: actionDesc,
        rating: affectedItem.rating,
      })
    }
  }

  const removeFromWatchlist = async (dramaId) => {
    const itemToRemove = watchlist.find((item) => (item.tmdb_id || item.id) === dramaId || item.id === dramaId)
    const updatedList = watchlist.filter(
      (item) => (item.tmdb_id || item.id) !== dramaId && item.id !== dramaId
    )
    saveItems(updatedList)
    watchlistService.removeFromWatchlist(userId, dramaId)
    if (itemToRemove) {
      logActivity({
        dramaId: itemToRemove.tmdb_id || itemToRemove.id,
        title: itemToRemove.title,
        poster: itemToRemove.poster || itemToRemove.image,
        status: 'Removed',
        action: 'Removed from watchlist',
      })
    }
  }

  const isInWatchlist = (dramaId) => {
    if (!dramaId) return false
    return watchlist.some(
      (item) => (item.tmdb_id || item.id) === dramaId || item.id === dramaId
    )
  }

  const getWatchlistItem = (dramaId) => {
    if (!dramaId) return null
    return (
      watchlist.find(
        (item) => (item.tmdb_id || item.id) === dramaId || item.id === dramaId
      ) || null
    )
  }

  const stats = useMemo(() => {
    const totalTracked = watchlist.length
    const watchingList = watchlist.filter((d) => d.status === 'Watching')
    const completedList = watchlist.filter((d) => d.status === 'Completed' || d.status === 'Done')
    const planList = watchlist.filter((d) => d.status === 'Plan' || d.status === 'Plan to Watch')
    const onHoldList = watchlist.filter((d) => d.status === 'On Hold' || d.status === 'Paused')
    const droppedList = watchlist.filter((d) => d.status === 'Dropped')
    const favoritesList = watchlist.filter((d) => d.is_favorite)

    const totalEpisodesWatched = watchlist.reduce((sum, item) => {
      if (item.status === 'Completed' || item.status === 'Done') {
        return sum + (item.episodes || 16)
      }
      return sum + (item.current_episode || item.watchedCount || 0)
    }, 0)

    const hoursWatched = Math.round(totalEpisodesWatched * 1.0)
    const currentlyWatching = watchingList.length > 0 ? watchingList[0] : null

    // Average rating calculation
    const ratedDramas = watchlist.filter((d) => d.rating && Number(d.rating) > 0)
    const avgRating = ratedDramas.length > 0
      ? (ratedDramas.reduce((sum, d) => sum + Number(d.rating), 0) / ratedDramas.length).toFixed(1)
      : '0.0'

    // Status breakdown with bars
    const statusBreakdown = [
      { label: 'Watching', count: watchingList.length, color: '#3b82f6', tone: 'blue' },
      { label: 'Completed', count: completedList.length, color: '#10b981', tone: 'green' },
      { label: 'Plan to Watch', count: planList.length, color: '#a855f7', tone: 'purple' },
      { label: 'On Hold', count: onHoldList.length, color: '#f59e0b', tone: 'yellow' },
      { label: 'Dropped', count: droppedList.length, color: '#ef4444', tone: 'red' },
    ].map((item) => ({
      ...item,
      percentage: totalTracked > 0 ? Math.round((item.count / totalTracked) * 100) : 0,
    }))

    // Favourite genres calculation
    const genreCounts = {}
    watchlist.forEach((drama) => {
      let gList = []
      if (Array.isArray(drama.genres)) {
        gList = drama.genres
      } else if (typeof drama.genres === 'string') {
        gList = drama.genres.split(/[,·•|/]/).map((g) => g.trim()).filter(Boolean)
      }
      gList.forEach((genre) => {
        const cleanGenre = genre.trim()
        if (cleanGenre) {
          genreCounts[cleanGenre] = (genreCounts[cleanGenre] || 0) + 1
        }
      })
    })

    const sortedGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    const topGenreMax = sortedGenres.length > 0 ? sortedGenres[0].count : 1
    const favouriteGenres = sortedGenres.map((g) => ({
      ...g,
      percentage: topGenreMax > 0 ? Math.round((g.count / topGenreMax) * 100) : 0,
    }))

    return {
      totalTracked,
      watchingCount: watchingList.length,
      completedCount: completedList.length,
      planCount: planList.length,
      onHoldCount: onHoldList.length,
      droppedCount: droppedList.length,
      favoritesCount: favoritesList.length,
      totalEpisodesWatched,
      hoursWatched,
      currentlyWatching,
      avgRating,
      ratedCount: ratedDramas.length,
      statusBreakdown,
      favouriteGenres,
    }
  }, [watchlist])

  // Effective History: logs if present, or synthesised from user's actual watchlist items
  const history = useMemo(() => {
    if (activities.length > 0) {
      return activities
    }
    if (watchlist.length > 0) {
      return watchlist.map((item) => {
        let action = `Added to ${item.status || 'Watchlist'}`
        if (item.status === 'Completed') {
          action = `Completed all ${item.episodes || 16} episodes`
        } else if (item.current_episode > 0) {
          action = `Watched Episode ${item.current_episode} of ${item.episodes || 16}`
        }
        return {
          id: item.id || item.tmdb_id,
          dramaId: item.tmdb_id || item.id,
          title: item.title,
          poster: item.poster || item.image,
          status: item.status,
          action,
          rating: item.rating,
          dateStr: item.addedDate || 'Recently',
          timestamp: item.id && typeof item.id === 'number' ? item.id : Date.now(),
        }
      })
    }
    return []
  }, [activities, watchlist])

  const value = {
    watchlist,
    isLoading,
    stats,
    history,
    addToWatchlist,
    updateWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistItem,
    logActivity,
  }

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }
  return context
}

export default WatchlistContext