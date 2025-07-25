// printerManager.js
const { print, getPrinters } = require('pdf-to-printer');

module.exports = {
  listPrinters: () => getPrinters(),

  /**
   * filePath – path to the PDF
   * opts = { preview, fit, orientation, printer }
   */
  printOne: (filePath, opts = {}) => {
    const { preview, fit, orientation, printer } = opts;

    if (preview) {
      return print(filePath, { printDialog: true });
    }

    const args = {};
    if (printer) args.printer = printer;

    // Build Sumatra print-settings
    const settings = [];
    if (fit) settings.push('fit');
    if (orientation && orientation !== 'auto')
      settings.push(`orientation:${orientation}`);
    if (settings.length)
      args.win32 = ['-print-settings', settings.join(',')];

    return print(filePath, args);
  },

  printAll: async (filePaths, opts) => {
    for (const fp of filePaths) {
      // eslint-disable-next-line no-await-in-loop
      await module.exports.printOne(fp, opts);
    }
  }
};
