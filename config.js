// config.js
const path = require('path');
const { app } = require('electron');
const userData = app.getPath('userData');

module.exports = {
  driveFolderId:   '1toNxMyj0sojyDud9-pOuR2lVcjzFf_tF',
  credentialsPath: path.join(__dirname, 'credentials.json'),
  tokenPath:       path.join(userData, 'token.json'),
  downloadDir:     path.join(userData, 'downloads'),
  settingsPath:    path.join(userData, 'settings.json'),
  pdfExtension:    '.pdf',
};
