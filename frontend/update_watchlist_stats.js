import fs from 'fs';

const filePath = '/Users/zndr/Documents/AppDev-KdramaWatchlist/frontend/src/context/WatchlistContext.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const getStatusKeyFn = `
const getStatusKey = (statusString) => {
  if (!statusString) return 'plan_to_watch'
  const s = statusString.toLowerCase().replace(' ', '_').replace(' to ', '_to_')
  if (s === 'plan') return 'plan_to_watch'
  if (s === 'paused') return 'on_hold'
  if (s === 'done') return 'completed'
  return s
}
`;

code = code.replace(
  /const stats = useMemo\(\(\) => \{/g,
  `${getStatusKeyFn}\n  const stats = useMemo(() => {`
);

code = code.replace(
  /const watchingList = watchlist\.filter\(\(d\) => d\.status === 'Watching'\)/g,
  "const watchingList = watchlist.filter((d) => getStatusKey(d.status) === 'watching')"
);
code = code.replace(
  /const completedList = watchlist\.filter\(\(d\) => d\.status === 'Completed' \|\| d\.status === 'Done'\)/g,
  "const completedList = watchlist.filter((d) => getStatusKey(d.status) === 'completed')"
);
code = code.replace(
  /const planList = watchlist\.filter\(\(d\) => d\.status === 'Plan' \|\| d\.status === 'Plan to Watch'\)/g,
  "const planList = watchlist.filter((d) => getStatusKey(d.status) === 'plan_to_watch')"
);
code = code.replace(
  /const onHoldList = watchlist\.filter\(\(d\) => d\.status === 'On Hold' \|\| d\.status === 'Paused'\)/g,
  "const onHoldList = watchlist.filter((d) => getStatusKey(d.status) === 'on_hold')"
);
code = code.replace(
  /const droppedList = watchlist\.filter\(\(d\) => d\.status === 'Dropped'\)/g,
  "const droppedList = watchlist.filter((d) => getStatusKey(d.status) === 'dropped')"
);

code = code.replace(
  /if \(item\.status === 'Completed' \|\| item\.status === 'Done'\) \{/g,
  "if (getStatusKey(item.status) === 'completed') {"
);

fs.writeFileSync(filePath, code);
