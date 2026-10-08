import fs from 'fs';

const filePath = '/Users/zndr/Documents/AppDev-KdramaWatchlist/frontend/src/services/watchlistService.js';
let code = fs.readFileSync(filePath, 'utf8');

const mapperCode = `
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
`;

code = code.replace(
  /export const watchlistService = \{/,
  `export const watchlistService = {\n${mapperCode}`
);

code = code.replace(
  /if \(response\.data && Array\.isArray\(response\.data\.data\)\) \{[\s\n]*return response\.data\.data[\s\n]*\}/,
  `if (response.data && Array.isArray(response.data.data)) {\n        return response.data.data.map(item => this.mapBackendToFrontend(item))\n      }`
);

fs.writeFileSync(filePath, code);
