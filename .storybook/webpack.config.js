const { compatibility, context } = require('../createConfig')
const { createModuleAndPlugins } = require('../webpack').webConfig
const { loadSanityParts } = require('../resolver')

module.exports = function adjustWebpackConfig({ config }) {
  const { module, plugins } = createModuleAndPlugins({
    isProduction: false,
    compatibility,
    loadParts: loadSanityParts,
    baseConfigName: 'sanity',
  })

  return {
    ...config,
    context,
    module,
    plugins: [...config.plugins, ...plugins]
  }
}
