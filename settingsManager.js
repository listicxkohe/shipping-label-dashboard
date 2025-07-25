// settingsManager.js
const fs     = require('fs');
const config = require('./config');

const defaults = { preview: false };

function loadSettings() {
  try {
    if (fs.existsSync(config.settingsPath)) {
      const data = JSON.parse(fs.readFileSync(config.settingsPath, 'utf8'));
      return { preview: Boolean(data.preview) };
    }
  } catch (e) {
    console.error('[settingsManager] load error', e);
  }
  return { ...defaults };
}

function saveSettings({ preview }) {
  try {
    fs.writeFileSync(
      config.settingsPath,
      JSON.stringify({ preview: Boolean(preview) }, null, 2)
    );
  } catch (e) {
    console.error('[settingsManager] save error', e);
  }
}

module.exports = { loadSettings, saveSettings };
