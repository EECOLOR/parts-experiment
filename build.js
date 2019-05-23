const { createConfig } = require('./config')
const { createMultiConfig } = require('./webpack').multiConfig
const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')

const isProduction = process.env.NODE_ENV === 'production'
if (!isProduction) throw new Error('non-production mode currently not supported by build')
const configEnv = process.env.CONFIG_ENV || 'development'

const { outputPath, publicPath, compatibility, context, config, productName, loadParts } =
  createConfig({ defaultContext: process.cwd(), configEnv })

const multiConfig = createMultiConfig({
  isProduction,
  context,
  config,
  productName,
  publicPath,
  outputPath,
  compatibility,
  webEntry: { client: './src/index.js' },
  nodeEntry: { ['index.html']: './src/index.html.js' },
  loadParts,
  generateTypeDefinitionFiles: false,
})

webpack(
  multiConfig,
  (e, stats) => {
    if (e) {
      console.error(e.stack || e)
      if (e.details) console.error(e.details)
      process.exit(1)
    }

    console.log(stats.toString({ colors: true }))
    if (stats.hasErrors()) process.exit(1)

    finishBuild()
      .then(_ => 0, e => (console.error(e), 1))
      .then(x => process.exit(x))
  }
)

async function finishBuild() {
  const target = path.resolve(outputPath, 'index.html')
  const indexHtml = require(target)
  console.log('Writing index.html ...')
  await fs.writeFile(target, indexHtml.default)
  console.log('Removing index.html.js ...')
  await fs.remove(path.resolve(outputPath, 'index.html.js'))
  console.log('Removing manifest.json ...')
  await fs.remove(path.resolve(outputPath, 'manifest.json'))
}