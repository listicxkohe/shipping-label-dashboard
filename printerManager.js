// printerManager.js
const path      = require('path');
const { execFile } = require('child_process');

// Path to your bundled SumatraPDF.exe
const SUMATRA = path.join(__dirname, 'assets', 'SumatraPDF.exe');

module.exports = {
  listPrinters: () => [],

  /**
   * Print a single PDF.
   * - preview=true → opens in default viewer (rejects on error)
   * - preview=false → Sumatra silent print (swallows all errors)
   */
  printOne: (pdfPath, opts = {}) => {
    return new Promise((resolve, reject) => {
      const absolute = path.resolve(pdfPath);

      if (opts.preview) {
        execFile('cmd', ['/c', 'start', '', `"${absolute}"`], err => {
          if (err) return reject(err);
          resolve();
        });
        return;
      }

      execFile(
        SUMATRA,
        ['-print-to-default', '-silent', '-print-settings', 'fit', 'landscape', absolute],
        { windowsHide: true },
        (err/*, stdout, stderr*/) => {
          if (err) {
            // silent mode: swallow ALL errors
            return resolve();
          }
          resolve();
        }
      );
    });
  },

  /**
   * Print multiple PDFs in sequence (errors all swallowed if silent).
   */
  printAll: async (pdfPaths, opts = {}) => {
    for (const p of pdfPaths) {
      // eslint-disable-next-line no-await-in-loop
      await module.exports.printOne(p, opts);
    }
  }
};
