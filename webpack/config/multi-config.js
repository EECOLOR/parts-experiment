const { createWebConfig } = require('./web-config')
const { createNodeConfig } = require('./node-config')

module.exports = {
  createMultiConfig
}

function createMultiConfig({
  isProduction,
  context,
  baseConfigName,
  productName,
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
      context,
      baseConfigName,
      productName,
      publicPath,
      outputPath,
      compatibility,
      entry: webEntry,
      loadParts,
    }),
    createNodeConfig({
      isProduction,
      context,
      baseConfigName,
      productName,
      outputPath,
      compatibility,
      entry: nodeEntry,
      loadParts,
      generateTypeDefinitionFiles,
    })
  ]
}