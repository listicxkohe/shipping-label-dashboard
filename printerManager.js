// printerManager.js
const { print } = require('pdf-to-printer');

module.exports = {
  /**
   * Print a single PDF, optionally showing the system print dialog.
   * @param {string} filePath
   * @param {boolean} preview – if true, show the dialog
   */
  printOne: (filePath, preview = false) =>
    print(filePath, preview ? { printDialog: true } : {}),

  /**
   * Print multiple PDFs in sequence, optionally showing the dialog each time.
   * @param {string[]} filePaths
   * @param {boolean} preview
   */
  printAll: async (filePaths, preview = false) => {
    for (const fp of filePaths) {
      await print(fp, preview ? { printDialog: true } : {});
    }
  },
};
