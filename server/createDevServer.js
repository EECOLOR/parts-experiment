const { createMultiConfig } = require('../webpack').multiConfig
const express = require('express')
const importFresh = require('import-fresh')
const path = require('path')
const webpack = require('webpack')

// This is a conscious choice over webpack-dev-server, ask me if you want to know (I hope I will still remember, haha)
const createWebpackHotMiddleware = require('webpack-hot-middleware')
const createWebpackDevMiddleware = require('webpack-dev-middleware')

module.exports = { createDevServer }

function createDevServer({
  isProduction,
  context,
  baseConfigName,
  publicPath,
  outputPath,
  compatibility,
  loadParts,
}) {
  const hotReloadEventPath = `${publicPath}__webpack_hmr`
  const hotReloadClient = `webpack-hot-middleware/client?path=${hotReloadEventPath}`

  const multiConfig = createMultiConfig({
    isProduction,
    context,
    baseConfigName,
    publicPath,
    outputPath,
    compatibility,
    webEntry: { client: ['./src/index.js'].concat(isProduction ? [] : [hotReloadClient]) },
    nodeEntry: { ['index.html']: './src/index.html.js' },
    loadParts,
    generateTypeDefinitionFiles: true,
  })

  const multiCompiler = webpack(multiConfig)
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
  return app
}