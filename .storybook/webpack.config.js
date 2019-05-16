const { compatibility } = require('../fakeConfig')
const { createModuleAndPlugins } = require('../webpack').webConfig

module.exports = function adjustWebpackConfig({ config }) {
  const { module, plugins } = createModuleAndPlugins({ compatibility, isProduction: false })

  return {
    ...config,
    module,
    plugins: [...config.plugins, ...plugins]
  }
}
