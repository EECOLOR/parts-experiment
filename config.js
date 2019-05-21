const path = require('path')
const { loadParts } = require('./resolver')

const productName = 'sanity'

module.exports = { createConfig }

function createConfig({ context }) {
  const configFileName = `${productName}.json`
  const sanityJson = require(require.resolve(configFileName, { paths: [context] }))

  return {
    context,
    baseConfigName: productName,
    outputPath: path.resolve(context, 'dist'),
    publicPath: sanityJson.project.basePath,
    compatibility: {
      optional_allowEsModule: true,
      all_onlyDefaultWhenEsModule: true,
      ...sanityJson.compatibility,
    },
    loadParts: context => loadParts({
      context,
      configFileName,
      pluginPackagePrefix: `${productName}-plugin-`
    }),
  }
}
