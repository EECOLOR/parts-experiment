const express = require('express')
const webpack = require('webpack')
const path = require('path')
const createWebConfig = require('./webpack/web-config')
const createNodeConfig = require('./webpack/node-config')
const importFresh = require('import-fresh')

// This is a conscious choice over webpack-dev-server, ask me if you want to know (I hope I will still remember, haha)
const createWebpackHotMiddleware = require('webpack-hot-middleware')
const createWebpackDevMiddleware = require('webpack-dev-middleware')

const isProduction = process.env.NODE_ENV === 'production'
if (isProduction) throw new Error('production mode currently not supported by serve')

const outputPath = path.resolve(__dirname, 'dist')
const publicPath = '/test/'
const compatibility = {
  optional_allowEsModule: true,
  all_onlyDefaultWhenEsModule: true,
}
const hotReloadEventPath = `${publicPath}__webpack_hmr`
const hotReloadClient = `webpack-hot-middleware/client?path=${hotReloadEventPath}`

const fullConfig = [
  createWebConfig({
    isProduction,
    publicPath,
    outputPath,
    compatibility,
    entry: { client: ['./src/index.js'].concat(isProduction ? [] : [hotReloadClient]) },
  }),
  createNodeConfig({
    isProduction,
    outputPath,
    compatibility,
    entry: { ['index.html']: './src/index.html.js' }
  })
]

const multiCompiler = webpack(fullConfig)
const [clientCompiler] = multiCompiler.compilers
const webpackDevMiddleware = !isProduction && createWebpackDevMiddleware(
  multiCompiler,
  {
    publicPath,
    writeToDisk: file => ['manifest.json', 'index.html.js'].includes(path.basename(file)),
    index: false,
  }
)
const webpackHotMiddleware = !isProduction && createWebpackHotMiddleware(
  clientCompiler,
  {
    path: hotReloadEventPath,
  }
)

const app = express()
webpackDevMiddleware && app.use(webpackDevMiddleware)
webpackHotMiddleware && app.use(webpackHotMiddleware)
app.get(`*`, (req, res) => {
  if (req.path.startsWith(publicPath)) {
    if (req.path.endsWith('hot-update.json')) res.status(404).send()
    else {
      const html = importFresh(path.resolve(outputPath, 'index.html'))
      res.status(200).send(html.default)
    }
  } else res.status(404).send(`Nothing served outside of the public path ('${publicPath}')`)
})
app.listen(8080)
