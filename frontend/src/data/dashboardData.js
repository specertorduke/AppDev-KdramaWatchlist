export const dashboardUser = {
  name: 'Ji-young',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80',
}

export const dashboardStats = [
  { value: '4', label: 'Listed', detail: 'in your list', icon: 'bookmark', tone: 'purple' },
  { value: '1', label: 'Watching', detail: 'airing now', icon: 'play', tone: 'blue' },
  { value: '1', label: 'Completed', detail: 'finished', icon: 'check', tone: 'green' },
  { value: '17h', label: 'Hours', detail: 'time watched', icon: 'clock', tone: 'yellow' },
]

export const currentDrama = {
  title: 'Midnight in Seoul',
  episode: 'Episode 4 of 16',
  runtime: '65m',
  logged: '3 eps',
  progress: 19,
  image: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=900&q=85',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
}

export const quickAccess = [
  { icon: 'clipboard', label: 'My Tracker', tone: 'blue' },
  { icon: 'plus', label: 'Add Drama', tone: 'purple' },
  { icon: 'pause', label: 'On Hold', tone: 'orange' },
  { icon: 'send', label: 'Plan to Watch', tone: 'teal' },
]

export const recommendedDramas = [
  {
    rank: 'TOP 4', title: "Devil's Pact", meta: 'Thriller · 14 eps', rating: '8.9', tone: 'orange',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=480&q=85',
  },
  {
    rank: 'TOP 6', title: 'Neon Requiem', meta: 'Crime · 10 eps', rating: '8.8', tone: 'cyan',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=480&q=85',
  },
  {
    rank: 'TOP 7', title: 'Hospital Playlist 3', meta: 'Drama · 12 eps', rating: '9.2', tone: 'green',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=480&q=85',
  },
  {
    rank: 'TOP 8', title: 'Crash Landing on You 2', meta: 'Romance · 16 eps', rating: '8.6', tone: 'purple',
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=480&q=85',
  },
]

export const discoverGenres = ['All', 'Romance', 'Thriller', 'Historical', 'Fantasy', 'Mystery', 'Comedy', 'Action', 'Crime', 'Drama']

export const discoverDramas = [
  { rank: 'TOP 1', title: 'Midnight in Seoul', meta: 'Romance · 16 eps', rating: '9.4', tone: 'pink', status: 'Watching', image: currentDrama.image },
  { rank: 'TOP 2', title: 'The Glass Kingdom', meta: 'Historical · 20 eps', rating: '9.1', tone: 'purple', status: 'Plan', image: recommendedDramas[1].image },
  { rank: 'TOP 3', title: 'Pale Lantern', meta: 'Mystery · 12 eps', rating: '9.0', tone: 'blue', status: 'Done', image: recommendedDramas[2].image },
  { rank: 'TOP 4', title: "Devil's Pact", meta: 'Thriller · 14 eps', rating: '8.9', tone: 'orange', image: recommendedDramas[0].image },
]

export const trackerDramas = [
  { title: 'Midnight in Seoul', meta: 'Romance · Thriller', episodes: '3/16 eps', progress: 19, rating: '9/10', note: 'Love the chemistry between the leads!', status: 'Watching', tone: 'blue', image: currentDrama.avatar },
  { title: 'The Glass Kingdom', meta: 'Historical · Fantasy', episodes: '0/20 eps', progress: 0, status: 'Plan', tone: 'purple', image: recommendedDramas[1].image },
  { title: 'Pale Lantern', meta: 'Mystery · Drama', episodes: '12/12 eps', progress: 100, rating: '10/10', note: 'Best mystery of 2025. Cried at the finale.', status: 'Done', tone: 'green', image: recommendedDramas[2].image },
  { title: 'Rose & Thorn', meta: 'Romance · Comedy', episodes: '3/16 eps', progress: 19, status: 'Paused', tone: 'yellow', image: recommendedDramas[3].image },
]
