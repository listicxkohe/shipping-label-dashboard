// printerManager.js
const { print } = require('pdf-to-printer');

module.exports = {
  /**
   * @param {string} filePath
   * @param {boolean} preview – if true show system dialog
   */
  printOne: (filePath, preview = false) =>
    print(filePath, { preview }),

  /**
   * @param {string[]} filePaths
   * @param {boolean} preview
   */
  printAll: async (filePaths, preview = false) => {
    for (const fp of filePaths) {
      await print(fp, { preview });
    }
  },
};
