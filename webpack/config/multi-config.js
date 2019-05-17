const { createWebConfig } = require('./web-config')
const { createNodeConfig } = require('./node-config')

module.exports = {
  createMultiConfig
}

function createMultiConfig({
  isProduction,
  publicPath,
  outputPath,
  compatibility,
  webEntry,
  nodeEntry,
  loadParts,
  generateTypeDefinitionFiles,
}) {
  return [
    createWebConfig({
      isProduction,
      publicPath,
      outputPath,
      compatibility,
      entry: webEntry,
      loadParts,
    }),
    createNodeConfig({
      isProduction,
      outputPath,
      compatibility,
      entry: nodeEntry,
      loadParts,
      generateTypeDefinitionFiles,
    })
  ]
}