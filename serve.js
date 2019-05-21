const { createConfig } = require('./config')
const { createDevServer } = require('./server')

const isProduction = process.env.NODE_ENV === 'production'
if (isProduction) throw new Error('production mode currently not supported by serve')

const { outputPath, publicPath, compatibility, context, baseConfigName, loadParts } =
  createConfig({ context: process.cwd() })

const app = createDevServer({
  isProduction,
  context,
  baseConfigName,
  outputPath,
  publicPath,
  compatibility,
  loadParts,
})

app.listen(8080)
