const importFresh = require('import-fresh')
const path = require('path')

const name = 'VersionResolverPlugin'

module.exports = VersionResolverPlugin

function VersionResolverPlugin({ productName }) {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(name, compilation)

      function compilation(compilation, { normalModuleFactory }) {
        addConfigResolver(normalModuleFactory, compiler.context, productName)
      }
    }
  }
}

function addConfigResolver(normalModuleFactory, context, productName) {

  normalModuleFactory.hooks.resolver.tap(
    name,
    original => (data, callback) => {
      const { request } = data

      if (request === `${productName}:versions`) {
        const object = getVersions(context, productName)
        const result = {
          request, userRequest: request, rawRequest: request, resource: request,
          loaders: [{
            loader: require.resolve('../loaders/object-loader'),
            options: { object },
          }],
          type: 'javascript/auto',
          parser: normalModuleFactory.getParser('javascript/auto'),
          generator: normalModuleFactory.getGenerator('javascript/auto'),
          resolveOptions: { isObjectLoaderRequest: true },
          settings: {},
          context: data.context,
        }
        callback(null, result)
      } else  original(data, callback)
    }
  )
  normalModuleFactory.hooks.module.tap(name, (module, result) => {
    // context of a normal module is extracted from the request, so we need to adjust it
    if (result.resolveOptions && result.resolveOptions.isObjectLoaderRequest)
      module.context = result.context
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
