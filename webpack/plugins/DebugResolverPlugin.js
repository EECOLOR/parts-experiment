const { partsParamName } = require('./PartsProviderPlugin')
const { resolveWithoutFile } = require('./utils')

const name = 'DebugResolverPlugin'

module.exports = DebugResolverPlugin

function DebugResolverPlugin({ productName }) {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(name, compilation)

      function compilation(compilation, { normalModuleFactory, [partsParamName]: parts }) {
        addDebugResolver(normalModuleFactory, compiler.context, productName, parts)
      }
    }
  }
}

function addDebugResolver(normalModuleFactory, context, productName, parts) {
  resolveWithoutFile({
    name,
    normalModuleFactory,
    getRequestData: request => request === `${productName}:debug`,
    createLoader: _ => ({
      loader: require.resolve('../loaders/object-loader'),
      options: {
        object: {
          basePath: context,
          plugins: [], // I don't think it's worth to implement this
          definitions: mapValues(parts, x => ({
            description: x.description,
            path: '', // I don't think it's worth to implement this, the path is in the implementations
            plugin: x.source,
          })),
          implementations: mapValues(parts, x => x.implementations.map(x => ({
            path: x.path,
            plugin: x.source,
          }))),
        }
      },
    })
  })
}

function mapValues(o, f) {
  return Object.entries(o).reduce(
    (result, [k, v]) => ({ ...result, [k]: f(v) }),
    {}
  )
}
