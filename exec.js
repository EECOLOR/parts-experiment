const { createConfig } = require('./config')
const { createNodeConfig } = require('./webpack').nodeConfig
const path = require('path')
const webpack = require('webpack')

const isProduction = process.env.NODE_ENV === 'production'
const [,, script] = process.argv

const { compatibility, context, baseConfigName, productName, loadParts } = createConfig({ context: process.cwd() })
const outputPath = path.resolve(__dirname, '.tmp')

const config = createNodeConfig({
  isProduction,
  context,
  baseConfigName,
  productName,
  outputPath,
  compatibility,
  entry: { ['index']: path.resolve(process.cwd(), script) },
  loadParts,
  generateTypeDefinitionFiles: false,
})

webpack(
  config,
  (e, stats) => {
    if (e) {
      console.error(e.stack || e)
      if (e.details) console.error(e.details)
      process.exit(1)
    }

    if (stats.hasErrors()) {
      console.log(stats.toString({ colors: true }))
      process.exit(1)
    }

    finishBuild()
      .then(_ => 0, e => (console.error(e), 1))
      .then(x => process.exit(x))
  }
)

async function finishBuild() {
  await require(path.resolve(outputPath, 'index'))
}
