const { resolveWithoutFile } = require('./utils')
const importFresh = require('import-fresh')
const path = require('path')

const name = 'VersionResolverPlugin'

module.exports = VersionResolverPlugin

function VersionResolverPlugin({ productName }) {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(name, compilation)

      function compilation(compilation, { normalModuleFactory }) {
        addVersionsResolver(normalModuleFactory, compiler.context, productName)
      }
    }
  }
}

function addVersionsResolver(normalModuleFactory, context, productName) {
  resolveWithoutFile({
    name,
    normalModuleFactory,
    getRequestData: request => request === `${productName}:versions`,
    createLoader: _ => ({
      loader: require.resolve('../loaders/object-loader'),
      options: { object: getVersions(context, productName) },
    }),
  })
}

function getVersions(context, productName) {
  const { dependencies = {}, devDependencies = {}} = importFresh(path.resolve('package.json'))
  const allDependencies = [...Object.keys(dependencies), ...Object.keys(devDependencies)]
  const targetDependencies = allDependencies.filter(x => x.startsWith(`@${productName}/`))

  return targetDependencies.reduce(
    (result, x) => ({
      ...result,
      [x]: importFresh(require.resolve(`${x}/package.json`, { paths: [context] })).version
    }),
    {}
  )
}
