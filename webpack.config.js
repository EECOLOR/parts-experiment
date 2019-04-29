const path = require('path')
const PartsPlugin = require('./PartsPlugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const ExtractCssChunks = require('mini-css-extract-plugin')
const { HotModuleReplacementPlugin } = require('webpack')

const isProduction = process.env.NODE_ENV === 'production'

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
        plugins: [
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
  ]
}

module.exports = [
  {
    mode: 'development',
    target: 'web',
    entry: { client: './src/index.js' },
    output: {
      publicPath: '/',
      filename: '[name].[hash].js',
      path: path.resolve(__dirname, 'dist')
    },
    module: { rules: [jsLoader, cssLoader] },
    plugins: [PartsPlugin(), new ManifestPlugin(), new ExtractCssChunks(), new HotModuleReplacementPlugin()],
    devServer: {
      hot: true,
      writeToDisk: true,
      serveIndex: false,
      after: (app, server) => {
        app.get('*', (req, res) => {
          const index = require.resolve(path.resolve(__dirname, 'dist', 'index.html'))
          delete require.cache[index]
          const html = require(index)
          res.status(200).send(html.default)
        })
      }
    }
  },
  {
    mode: 'development',
    target: 'node',
    entry: { ['index.html']: './src/index.html.js' },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'commonjs'
    },
    module: { rules: [jsLoader] },
    plugins: [PartsPlugin({ generateTypeDefinitionFiles: true }), {
      apply: compiler => {
        compiler.hooks.entryOption.tap('https://github.com/webpack/webpack-dev-server/pull/1775', (context, entry) => {
          entry['index.html'] = './src/index.html.js'
        })
      }
    }]
  }
]
