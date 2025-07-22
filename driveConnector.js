// driveConnector.js

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { BrowserWindow } = require('electron');
const config = require('./config');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
let authPromise = null;  // singleton

async function authorize() {
  // If an auth is already in progress (or done), reuse it
  if (authPromise) return authPromise;

  authPromise = (async () => {
    // Load client credentials
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
        await oAuth2Client.getAccessToken();  // validate
        return oAuth2Client;
      } catch (err) {
        console.warn('[driveConnector] invalid token, deleting...', err);
        fs.unlinkSync(config.tokenPath);
      }
    }

    // No valid token → OAuth flow
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });
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
        if (!code) {
          reject(new Error('No code found in redirect URL'));
          return;
        }

        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          fs.writeFileSync(config.tokenPath, JSON.stringify(tokens, null, 2));
          resolve(oAuth2Client);
        } catch (err) {
          reject(err);
        } finally {
          authWin.close();
        }
      };

      authWin.webContents.on('will-redirect', handleRedirect);
      authWin.webContents.on('did-navigate', handleRedirect);
      authWin.on('closed', () => {
        reject(new Error('OAuth window closed by user'));
      });
    });
  })().catch(err => {
    // If auth fails, clear promise so user can retry
    authPromise = null;
    throw err;
  });

  return authPromise;
}

async function listFileMetadata() {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const all = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${config.driveFolderId}' in parents and mimeType='application/pdf'`,
      fields: 'nextPageToken, files(id, name, modifiedTime)',
      pageToken: pageToken || undefined,
    });
    pageToken = res.data.nextPageToken;
    all.push(...res.data.files);
  } while (pageToken);

  return all;
}

async function downloadFile(fileId, fileName) {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const localPath = path.join(config.downloadDir, fileName);

  if (!fs.existsSync(config.downloadDir)) {
    fs.mkdirSync(config.downloadDir, { recursive: true });
  }

  await new Promise((res, rej) => {
    drive.files
      .get({ fileId, alt: 'media' }, { responseType: 'stream' })
      .then(({ data: stream }) => {
        stream.on('end', res).on('error', rej)
              .pipe(fs.createWriteStream(localPath));
      })
      .catch(rej);
  });

  return localPath;
}

async function deleteRemoteFile(fileId) {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
}

module.exports = {
  listFileMetadata,
  downloadFile,
  deleteRemoteFile,
};
