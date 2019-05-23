const { createConfig } = require('./config')
const { createDevServer } = require('./server')

const isProduction = process.env.NODE_ENV === 'production'
if (isProduction) throw new Error('production mode currently not supported by serve')
const configEnv = process.env.CONFIG_ENV || 'development'

const { outputPath, publicPath, compatibility, context, config, productName, loadParts } =
  createConfig({ defaultContext: process.cwd(), configEnv })

const app = createDevServer({
  isProduction,
  context,
  config,
  productName,
  outputPath,
  publicPath,
  compatibility,
  loadParts,
})

app.listen(8080)
