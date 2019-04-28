const path = require('path')
const partsPlugin = require('./PartsPlugin')

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [partsPlugin]
}

