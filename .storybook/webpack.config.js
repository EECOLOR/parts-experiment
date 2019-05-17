const { compatibility } = require('../fakeConfig')
const { createModuleAndPlugins } = require('../webpack').webConfig
const { loadSanityParts } = require('../resolver')

module.exports = function adjustWebpackConfig({ config }) {
  const { module, plugins } = createModuleAndPlugins({
    isProduction: false,
    compatibility,
    loadParts: loadSanityParts,
  })

  return {
    ...config,
    module,
    plugins: [...config.plugins, ...plugins]
  }
}
