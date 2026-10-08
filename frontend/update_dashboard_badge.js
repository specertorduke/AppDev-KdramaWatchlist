import fs from 'fs';

const filePath = '/Users/zndr/Documents/AppDev-KdramaWatchlist/frontend/src/components/Dashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const target = `{drama.status && (
          <span className={\`recommended-status-badge status-\${statusKey}\`}>
            <span className="recommended-status-dot" />
            {formatStatusLabel(drama.status)}
          </span>
        )}`;

const replacement = `{(drama.status || drama.watch_status) && (
          <span className={\`recommended-status-badge status-\${statusKey}\`}>
            <span className="recommended-status-dot" />
            {formatStatusLabel(drama.status || drama.watch_status)}
          </span>
        )}`;

code = code.replace(target, replacement);

fs.writeFileSync(filePath, code);
