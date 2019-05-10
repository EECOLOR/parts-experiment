const path = require('path')

module.exports = {
  outputPath: path.resolve(__dirname, 'dist'),
  publicPath: '/test/',
  compatibility: {
    optional_allowEsModule: true,
    all_onlyDefaultWhenEsModule: true,
  },
}