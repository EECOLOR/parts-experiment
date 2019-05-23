const { createConfig } = require('../config')
const { createModuleAndPlugins } = require('../webpack').webConfig
const { loadSanityParts } = require('../resolver')
const path = require('path')

module.exports = function adjustWebpackConfig({ config }) {
  const sanityConfig = createConfig({ defaultContext: path.resolve(__dirname, '../') })

  const { module, plugins } = createModuleAndPlugins({
    isProduction: false,
    ...sanityConfig
  })

  return {
    ...config,
    context: sanityConfig.context,
    module,
    plugins: [...config.plugins, ...plugins]
  }
}
