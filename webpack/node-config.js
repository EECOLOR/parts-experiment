const { DefinePlugin } = require('webpack')
const createJsConfig = require('./js')
const nodeExternals = require('webpack-node-externals')
const PartsPlugin = require('./PartsPlugin')

module.exports = {
  createNodeConfig
}

function createNodeConfig({
  isProduction,
  outputPath,
  compatibility,
  entry,
}) {
  const { optional_allowEsModule, all_onlyDefaultWhenEsModule } = compatibility

  const js = createJsConfig()

  return {
    mode: isProduction ? 'production' : 'development',
    target: 'node',
    externals: [nodeExternals()],
    entry,
    output: {
      filename: '[name].js',
      path: outputPath,
      libraryTarget: 'commonjs'
    },
    module: { rules: [{ test: /\.js$/, exclude: /node_modules/, use: js.loaders }] },
    plugins: [
      PartsPlugin({ generateTypeDefinitionFiles: true, optional_allowEsModule, all_onlyDefaultWhenEsModule }),
      new DefinePlugin({ PARTS_COMPATIBILITY: JSON.stringify(compatibility) }),
    ]
  }
}
