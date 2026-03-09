/* 
   server.js — Entry point for Her Universe
   All backend logic lives in ./backend/
 */
require('dotenv').config();
const createApp = require('./backend/app');
const { PORT, UPLOAD_PIN, MAX_FILE_MB, SITE_URL } = require('./backend/config');

const app = createApp();

app.listen(PORT, () => {
  console.log('\n\u2728 Her Universe \u2192 http://localhost:' + PORT);
  console.log('   Upload PIN : ' + UPLOAD_PIN);
  console.log('   Max size   : ' + MAX_FILE_MB + 'MB per file');
  console.log('   Sitemap    : ' + SITE_URL + '/sitemap.xml');
  console.log('   Health     : http://localhost:' + PORT + '/api/health\n');
});