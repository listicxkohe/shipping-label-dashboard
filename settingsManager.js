// settingsManager.js
const fs = require('fs');
const config = require('./config');

const defaults = {
  fit: true,
  orientation: 'auto',  // 'auto' | 'portrait' | 'landscape'
  printer: null,        // null = system default
  preview: false
};

function loadSettings() {
  try {
    if (fs.existsSync(config.settingsPath)) {
      return JSON.parse(fs.readFileSync(config.settingsPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[settingsManager] failed to load, using defaults', e);
  }
  return { ...defaults };
}

function saveSettings(settings) {
  const toStore = { ...defaults, ...settings };
  try {
    fs.writeFileSync(config.settingsPath, JSON.stringify(toStore, null, 2));
  } catch (e) {
    console.error('[settingsManager] failed to save', e);
  }
}

module.exports = { loadSettings, saveSettings };
