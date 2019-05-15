const { HotModuleReplacementPlugin, DefinePlugin } = require('webpack')
const createCssConfig = require('./css')
const createJsConfig = require('./js')
const ManifestPlugin = require('webpack-manifest-plugin')
const PartsPlugin = require('./PartsPlugin')

module.exports = {
  createWebConfig,
  createModuleAndPlugins,
}

function createWebConfig({
  isProduction,
  publicPath,
  outputPath,
  compatibility,
  entry,
}) {
  return {
    mode: isProduction ? 'production' : 'development',
    target: 'web',
    entry,
    output: {
      publicPath,
      filename: '[name].[hash].js',
      path: outputPath
    },
    ...createModuleAndPlugins({ compatibility, isProduction }),
  }
}

function createModuleAndPlugins({ compatibility, isProduction }) {

  const { optional_allowEsModule, all_onlyDefaultWhenEsModule } = compatibility
  const css = createCssConfig(isProduction)
  const js = createJsConfig()

  return {
    module: { rules: [
      { test: /\.js$/, exclude: /node_modules/, use: js.loaders },
      { test: /\.css$/, exclude: /node_modules/, use: css.loaders }
    ]},
    plugins: [
      PartsPlugin({ optional_allowEsModule, all_onlyDefaultWhenEsModule }),
      ...css.plugins,
      new ManifestPlugin(),
      !isProduction && new HotModuleReplacementPlugin(),
      new DefinePlugin({ PARTS_COMPATIBILITY: JSON.stringify(compatibility) }),
    ].filter(Boolean),
  }
}
