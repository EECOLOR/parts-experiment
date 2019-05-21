const { createWebConfig } = require('./web-config')
const { createNodeConfig } = require('./node-config')

module.exports = {
  createMultiConfig
}

function createMultiConfig({
  isProduction,
  basePath,
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
      basePath,
      publicPath,
      outputPath,
      compatibility,
      entry: webEntry,
      loadParts,
    }),
    createNodeConfig({
      isProduction,
      basePath,
      outputPath,
      compatibility,
      entry: nodeEntry,
      loadParts,
      generateTypeDefinitionFiles,
    })
  ]
}