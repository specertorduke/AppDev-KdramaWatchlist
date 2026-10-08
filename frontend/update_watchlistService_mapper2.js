import fs from 'fs';

const filePath = '/Users/zndr/Documents/AppDev-KdramaWatchlist/frontend/src/services/watchlistService.js';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  /if \(response\.data && response\.data\.data\) \{[\s\n]*return response\.data\.data[\s\n]*\}/g,
  `if (response.data && response.data.data) {\n        return this.mapBackendToFrontend(response.data.data)\n      }`
);

fs.writeFileSync(filePath, code);
