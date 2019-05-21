const { loadSanityParts } = require('./resolver')
const { createDevServer } = require('./server')

const isProduction = process.env.NODE_ENV === 'production'
if (isProduction) throw new Error('production mode currently not supported by serve')

const { outputPath, publicPath, compatibility, basePath } = require('./fakeConfig')

const app = createDevServer({
  isProduction,
  basePath,
  outputPath,
  publicPath,
  compatibility,
  loadParts: loadSanityParts,
})

app.listen(8080)
