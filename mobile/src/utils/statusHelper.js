export const STATUS_OPTIONS = [
  'Watching',
  'Completed',
  'Plan to Watch',
  'On Hold',
  'Dropped',
];

export const CANONICAL_STATUS_MAP = {
  watching: 'Watching',
  completed: 'Completed',
  plan_to_watch: 'Plan to Watch',
  'plan to watch': 'Plan to Watch',
  'plan to watch': 'Plan to Watch',
  on_hold: 'On Hold',
  'on hold': 'On Hold',
  dropped: 'Dropped',
};

export const toDisplayStatus = (status) => {
  if (!status) return 'Plan to Watch';
  const key = String(status).toLowerCase().replace(/_/g, ' ').trim();
  if (key.includes('watch') && !key.includes('plan')) return 'Watching';
  if (key.includes('complete')) return 'Completed';
  if (key.includes('plan')) return 'Plan to Watch';
  if (key.includes('hold')) return 'On Hold';
  if (key.includes('drop')) return 'Dropped';
  return CANONICAL_STATUS_MAP[key] || 'Plan to Watch';
};

export const toApiStatus = (status) => {
  if (!status) return 'plan_to_watch';
  const display = toDisplayStatus(status);
  return display.toLowerCase().replace(/ /g, '_');
};

export const getStatusColor = (status, colors = {}, isDark = true) => {
  const display = toDisplayStatus(status);
  switch (display) {
    case 'Watching':
      return isDark ? '#60A5FA' : (colors.blue || '#2B6CB0');
    case 'Completed':
      return isDark ? '#10B981' : (colors.green || '#047857');
    case 'Plan to Watch':
      return '#FFD76A';
    case 'On Hold':
      return isDark ? '#F59E0B' : '#D97706';
    case 'Dropped':
      return colors.danger || '#EF4444';
    default:
      return colors.pink || '#EB5B78';
  }
};
