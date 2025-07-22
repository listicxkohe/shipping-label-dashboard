// config.js

const path = require('path');
// In a packaged Electron app, __dirname points inside the ASAR (read-only).
// We need a writable location for tokens & downloaded PDFs:
const { app } = require('electron');
const userData = app.getPath('userData');

module.exports = {
  // Your Google Drive folder ID (unchanged)
  driveFolderId: '1toNxMyj0sojyDud9-pOuR2lVcjzFf_tF',

  // Path to your OAuth2 credentials (bundled with your app)
  credentialsPath: path.join(__dirname, 'credentials.json'),

  // Where to store the OAuth token after first auth (in userData)
  tokenPath: path.join(userData, 'token.json'),

  // Local folder to download PDFs into (in userData/downloads)
  downloadDir: path.join(userData, 'downloads'),

  // PDF file extension filter (if you need it)
  pdfExtension: '.pdf',
};
