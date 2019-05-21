const { DefinePlugin } = require('webpack')
const createJsConfig = require('./js')
const nodeExternals = require('webpack-node-externals')
const ConfigResolverPlugin = require('../plugins/ConfigResolverPlugin')
const PartsPlugin = require('../plugins/PartsPlugin')

module.exports = {
  createNodeConfig
}

function createNodeConfig({
  isProduction,
  context,
  baseConfigName,
  outputPath,
  compatibility,
  entry,
  loadParts,
  generateTypeDefinitionFiles,
}) {
  const { optional_allowEsModule, all_onlyDefaultWhenEsModule } = compatibility

  const js = createJsConfig()

  return {
    mode: isProduction ? 'production' : 'development',
    target: 'node',
    context,
    externals: [nodeExternals()],
    entry,
    output: {
      filename: '[name].js',
      path: outputPath,
      libraryTarget: 'commonjs'
    },
    // TODO: we should probably test for plugins
    module: { rules: [{ test: /\.js$/, exclude: /node_modules/, use: js.loaders }] },
    plugins: [
      PartsPlugin({ loadParts, generateTypeDefinitionFiles, optional_allowEsModule, all_onlyDefaultWhenEsModule }),
      ConfigResolverPlugin({ baseConfigName }),
      // TODO: VersionResolverPlugin - @sanity/util - getSanityVersions,
      new DefinePlugin({ PARTS_COMPATIBILITY: JSON.stringify(compatibility) }),
    ]
  }
}
