const path = require('path')
const PartsPlugin = require('./PartsPlugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const ExtractCssChunks = require('mini-css-extract-plugin')
const { HotModuleReplacementPlugin, DefinePlugin } = require('webpack')
const nodeExternals = require('webpack-node-externals')
const importFresh = require('import-fresh')

const isProduction = process.env.NODE_ENV === 'production'

const outputPath = path.resolve(__dirname, 'dist')
const mode = isProduction ? 'production' : 'development'

const backwardsCompatible = false

const jsLoader = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: [
    {
      loader: 'babel-loader',
      options: { presets: ['@babel/preset-env', '@babel/preset-react'] }
    }
  ]
}

const cssLoader = {
  test: /\.css$/,
  exclude: /node_modules/,
  use: [
    { loader: ExtractCssChunks.loader, options: { hmr: !isProduction } },
    {
      loader: 'css-loader',
      options: { modules: true, sourceMap: true, importLoaders: 1 }
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        plugins: loaderContext => {
          const resolve = PartsPlugin.getResolve(loaderContext)
          return [
            require('postcss-import')({ resolve: (file, context) => resolve(context, file) }),
            require('postcss-preset-env')({
              features: {
                'custom-properties': { preserve: false },
                'custom-media-queries': true,
                'media-query-ranges': true,
                'custom-selectors': true,
                'nesting-rules': true,
                'color-functional-notation': true,
                'color-mod-function': true,
                'font-variant-property': true,
                'all-property': true,
                'any-link-pseudo-class': true,
                'matches-pseudo-class': true,
                'not-pseudo-class': true,
                'overflow-wrap-property': true,
              },
            })
          ]
        }
      }
    }
  ]
}

module.exports = [
  {
    mode,
    target: 'web',
    entry: { client: './src/index.js' },
    output: {
      publicPath: '/',
      filename: '[name].[hash].js',
      path: outputPath
    },
    module: { rules: [jsLoader, cssLoader] },
    plugins: [
      PartsPlugin({ backwardsCompatible }),
      new ManifestPlugin(),
      new ExtractCssChunks({
        filename: isProduction ? '[name].[hash].css' : '[name].css' // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/391
      }),
      !isProduction && new HotModuleReplacementPlugin(),
      new DefinePlugin({ BACKWARDS_COMPATIBLE: JSON.stringify(backwardsCompatible) })
    ].filter(Boolean),
    devServer: {
      hot: !isProduction,
      writeToDisk: true,
      serveIndex: false,
      after: (app, server) => {
        app.get('*', (req, res) => {
          const html = importFresh(path.resolve(outputPath, 'index.html'))
          res.status(200).send(html.default)
        })
      }
    }
  },
  {
    mode,
    target: 'node',
    externals: [nodeExternals()],
    entry: { ['index.html']: './src/index.html.js' },
    output: {
      filename: '[name].js',
      path: outputPath,
      libraryTarget: 'commonjs'
    },
    module: { rules: [jsLoader] },
    plugins: [
      PartsPlugin({ generateTypeDefinitionFiles: true, backwardsCompatible }),
      {
        apply: compiler => {
          compiler.hooks.entryOption.tap('https://github.com/webpack/webpack-dev-server/pull/1775', (context, entry) => {
            entry['index.html'] = './src/index.html.js'
          })
        }
      }
    ]
  }
]

// This is just for
