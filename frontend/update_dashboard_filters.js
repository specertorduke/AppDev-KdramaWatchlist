import fs from 'fs';

const filePath = '/Users/zndr/Documents/AppDev-KdramaWatchlist/frontend/src/components/Dashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  /if \(activeFilter === 'Watching'\) return drama\.status === 'Watching'/g,
  "if (activeFilter === 'Watching') return getStatusKey(drama.status) === 'watching'"
);
code = code.replace(
  /if \(activeFilter === 'Completed'\) return drama\.status === 'Completed' \|\| drama\.status === 'Done'/g,
  "if (activeFilter === 'Completed') return getStatusKey(drama.status) === 'completed' || getStatusKey(drama.status) === 'done'"
);
code = code.replace(
  /if \(activeFilter === 'Plan'\) return drama\.status === 'Plan' \|\| drama\.status === 'Plan to Watch'/g,
  "if (activeFilter === 'Plan') return getStatusKey(drama.status) === 'plan' || getStatusKey(drama.status) === 'plan_to_watch'"
);
code = code.replace(
  /if \(activeFilter === 'On Hold'\) return drama\.status === 'On Hold' \|\| drama\.status === 'Paused'/g,
  "if (activeFilter === 'On Hold') return getStatusKey(drama.status) === 'on_hold' || getStatusKey(drama.status) === 'paused'"
);
code = code.replace(
  /if \(activeFilter === 'Dropped'\) return drama\.status === 'Dropped'/g,
  "if (activeFilter === 'Dropped') return getStatusKey(drama.status) === 'dropped'"
);

fs.writeFileSync(filePath, code);
