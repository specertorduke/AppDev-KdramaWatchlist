import fs from 'fs';

const filePath = '/Users/zndr/Documents/AppDev-KdramaWatchlist/frontend/src/services/watchlistService.js';
let code = fs.readFileSync(filePath, 'utf8');

const mapStatusToBackend = (status) => {
  if (!status) return 'plan_to_watch';
  const s = status.toLowerCase();
  if (s === 'plan to watch' || s === 'plan_to_watch') return 'plan_to_watch';
  if (s === 'watching') return 'watching';
  if (s === 'completed') return 'completed';
  if (s === 'on hold' || s === 'on_hold') return 'on_hold';
  if (s === 'dropped') return 'dropped';
  return 'plan_to_watch';
};

code = code.replace(/api\.get\('\/watchlists'\)/g, "api.get('/tracker')");
code = code.replace(/api\.post\('\/watchlists'/g, "api.post('/tracker'");
code = code.replace(/api\.patch\(`\/watchlists\/\$\{itemId\}`/g, "api.patch(`/tracker/${itemId}`");
code = code.replace(/api\.delete\(`\/watchlists\/\$\{itemId\}`/g, "api.delete(`/tracker/${itemId}`");

// We need to inject the backend mapping for add
code = code.replace(
  /status: status,/g,
  `status: typeof status === 'string' ? status.toLowerCase().replace(' ', '_').replace(' to ', '_to_') : 'plan_to_watch',`
);

// We need to map back to frontend status when fetching
// But wait! WatchlistContext doesn't map it!
// Let's just fix the endpoints first and see what happens.
// Wait, if backend returns plan_to_watch, WatchlistContext uses it directly!
// But wait, the frontend Dashboard.jsx actually handles `plan_to_watch` via getStatusKey!
// `getStatusKey` handles both `plan_to_watch` and `Plan to Watch`!
// Yes, I checked this earlier: `getStatusKey` lowercases and replaces `_` with ` `.

fs.writeFileSync(filePath, code);
