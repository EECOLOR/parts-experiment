const ExtractCssChunks = require('mini-css-extract-plugin')
const PartsPlugin = require('../plugins/PartsPlugin')

module.exports = isProduction => ({
  loaders: [
    { loader: ExtractCssChunks.loader, options: { hmr: !isProduction } },
    {
      loader: 'css-loader',
      options: { modules: true, sourceMap: true, importLoaders: 1 }
    },
    {
      loader: 'postcss-loader',
      options: {
        config: { path: __dirname },
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
  ],
  plugins: [
    new ExtractCssChunks({
      filename: isProduction ? '[name].[hash].css' : '[name].css' // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/391
    }),
  ]
})
