// driveConnector.js

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { BrowserWindow } = require('electron');
const config = require('./config');

// Full Drive scope so we can delete files
const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function authorize() {
  console.log('[driveConnector] authorize() start');
  const raw = fs.readFileSync(config.credentialsPath, 'utf8');
  const { installed: creds } = JSON.parse(raw);
  const { client_id, client_secret, redirect_uris } = creds;
  const redirectUri = redirect_uris[0];
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  // Try existing token
  if (fs.existsSync(config.tokenPath)) {
    try {
      const token = JSON.parse(fs.readFileSync(config.tokenPath, 'utf8'));
      oAuth2Client.setCredentials(token);
      // Validate
      await oAuth2Client.getAccessToken();
      console.log('[driveConnector] existing token valid');
      return oAuth2Client;
    } catch (err) {
      console.warn('[driveConnector] stored token invalid, deleting', err);
      fs.unlinkSync(config.tokenPath);
    }
  }

  // No valid token → launch OAuth window
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',    // force new consent to get full scopes
    scope: SCOPES,
  });
  console.log('[driveConnector] opening auth window at', authUrl);

  const authWin = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  authWin.loadURL(authUrl);

  return new Promise((resolve, reject) => {
    const handleRedirect = async (e, url) => {
      if (!url.startsWith(redirectUri)) return;
      e.preventDefault();
      const code = new URL(url).searchParams.get('code');
      if (!code) return reject(new Error('No code found in redirect'));
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(config.tokenPath, JSON.stringify(tokens, null, 2));
        console.log('[driveConnector] new token acquired & saved');
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      } finally {
        authWin.close();
      }
    };

    authWin.webContents.on('will-redirect', handleRedirect);
    authWin.webContents.on('did-navigate', handleRedirect);
    authWin.on('closed', () => reject(new Error('OAuth window closed by user')));
  });
}

/**
 * Fetch only metadata for all PDFs in the Drive folder.
 * @returns {Promise<Array<{ id, name, modifiedTime }>>}
 */
async function listFileMetadata() {
  console.log('[driveConnector] listFileMetadata() start');
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const all = [];
  let pageToken = null;

  do {
    console.log('[driveConnector] listing metadata, pageToken=', pageToken);
    const res = await drive.files.list({
      q: `'${config.driveFolderId}' in parents and mimeType='application/pdf'`,
      fields: 'nextPageToken, files(id, name, modifiedTime)',
      pageToken: pageToken || undefined,
    });
    pageToken = res.data.nextPageToken;
    all.push(...res.data.files);
  } while (pageToken);

  console.log('[driveConnector] metadata fetch complete:', all.length, 'files');
  return all;
}

/**
 * Download a single PDF by its fileId, saving as fileName in downloadDir.
 * @param {string} fileId
 * @param {string} fileName
 * @returns {Promise<string>} localPath
 */
async function downloadFile(fileId, fileName) {
  console.log('[driveConnector] downloadFile()', fileName);
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const localPath = path.join(config.downloadDir, fileName);

  // Ensure downloadDir exists
  if (!fs.existsSync(config.downloadDir)) {
    fs.mkdirSync(config.downloadDir, { recursive: true });
  }

  // Download stream
  await new Promise((resolve, reject) => {
    drive.files
      .get({ fileId, alt: 'media' }, { responseType: 'stream' })
      .then(({ data: stream }) => {
        stream
          .on('end', () => {
            console.log('[driveConnector] download complete:', fileName);
            resolve();
          })
          .on('error', reject)
          .pipe(fs.createWriteStream(localPath));
      })
      .catch(reject);
  });

  return localPath;
}

/**
 * Delete a file in Drive by fileId.
 * @param {string} fileId
 */
async function deleteRemoteFile(fileId) {
  console.log('[driveConnector] deleteRemoteFile()', fileId);
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  try {
    await drive.files.delete({ fileId });
    console.log('[driveConnector] file deleted:', fileId);
  } catch (err) {
    console.error('[driveConnector] delete error:', err);
  }
}

module.exports = {
  listFileMetadata,
  downloadFile,
  deleteRemoteFile,
};
