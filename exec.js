const { createNodeConfig } = require('./webpack').nodeConfig
const { loadSanityParts } = require('./resolver')
const path = require('path')
const webpack = require('webpack')

const isProduction = process.env.NODE_ENV === 'production'
const [,, script] = process.argv

const { compatibility } = require('./fakeConfig')
const outputPath = path.resolve(__dirname, '.tmp')

const config = createNodeConfig({
  isProduction,
  outputPath,
  compatibility,
  entry: { ['index']: path.resolve(process.cwd(), script) },
  loadParts: loadSanityParts,
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
