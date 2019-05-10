const createMultiConfig = require('./webpack/multi-config')
const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')

const isProduction = process.env.NODE_ENV === 'production'
if (!isProduction) throw new Error('non-production mode currently not supported by build')

// get these from config
const outputPath = path.resolve(__dirname, 'dist')
const publicPath = '/test/'
const compatibility = {
  optional_allowEsModule: true,
  all_onlyDefaultWhenEsModule: true,
}

const multiConfig = createMultiConfig({
  isProduction,
  publicPath,
  outputPath,
  compatibility,
  webEntry: { client: './src/index.js' },
  nodeEntry: { ['index.html']: './src/index.html.js' },
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