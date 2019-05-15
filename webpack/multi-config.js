const { createWebConfig } = require('./web-config')
const { createNodeConfig } = require('./node-config')

module.exports = function createMultiConfig({
  isProduction,
  publicPath,
  outputPath,
  compatibility,
  webEntry,
  nodeEntry,
}) {
  return [
    createWebConfig({
      isProduction,
      publicPath,
      outputPath,
      compatibility,
      entry: webEntry,
    }),
    createNodeConfig({
      isProduction,
      outputPath,
      compatibility,
      entry: nodeEntry,
    })
  ]
}