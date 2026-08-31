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
    return newItem
  }

  const updateWatchlist = async (dramaId, updates) => {
    const updatedList = watchlist.map((item) => {
      if ((item.tmdb_id || item.id) === dramaId || item.id === dramaId) {
        const totalEps = updates.episodes || item.episodes || 16
        const curEp = typeof updates.current_episode === 'number'
          ? updates.current_episode
          : (typeof updates.watchedCount === 'number' ? updates.watchedCount : item.current_episode || 0)
        const progress = totalEps > 0 ? Math.round((curEp / totalEps) * 100) : 0
        const newStatus = updates.status || item.status || 'Watching'

        return {
          ...item,
          ...updates,
          current_episode: curEp,
          watchedCount: curEp,
          progress,
          status: newStatus,
          tone: newStatus === 'Watching' ? 'blue' : newStatus === 'Completed' ? 'green' : newStatus === 'On Hold' ? 'orange' : 'purple',
          logged: 'Today',
        }
      }
      return item
    })

    saveItems(updatedList)
    watchlistService.updateWatchlistItem(userId, dramaId, updates)
  }

  const removeFromWatchlist = async (dramaId) => {
    const updatedList = watchlist.filter(
      (item) => (item.tmdb_id || item.id) !== dramaId && item.id !== dramaId
    )
    saveItems(updatedList)
    watchlistService.removeFromWatchlist(userId, dramaId)
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

    const hoursWatched = Math.round(totalEpisodesWatched * 1.1)
    const currentlyWatching = watchingList.length > 0 ? watchingList[0] : null

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
    }
  }, [watchlist])

  const value = {
    watchlist,
    isLoading,
    stats,
    addToWatchlist,
    updateWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistItem,
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