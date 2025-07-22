// config.js
const path = require('path');

module.exports = {
  // Google Drive folder ID where your PDFs are stored
  // ← set this to your actual folder ID, e.g. '1aBcD…'
  driveFolderId: '1toNxMyj0sojyDud9-pOuR2lVcjzFf_tF',

  // Local folder to download PDFs into (inside the app directory)
  downloadDir: path.join(__dirname, 'downloads'),

  // Path to your OAuth2 credentials file (downloaded from Google Cloud)
  credentialsPath: path.join(__dirname, 'credentials.json'),

  // Where to store your token after first auth (inside the app directory)
  tokenPath: path.join(__dirname, 'token.json'),

  // PDF file extension filter
  pdfExtension: '.pdf',
};
