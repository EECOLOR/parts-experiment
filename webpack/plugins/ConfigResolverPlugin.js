const { resolveWithoutFile } = require('./utils')
const path = require('path')

const name = 'ConfigResolverPlugin'

module.exports = ConfigResolverPlugin

function ConfigResolverPlugin({ config, productName }) {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(name, compilation)

      function compilation(compilation, { normalModuleFactory }) {
        addConfigResolver(normalModuleFactory, compiler.context, config, productName)
      }
    }
  }
}

function addConfigResolver(normalModuleFactory, context, config, productName) {
  const configRegExp = /^config:(.+)$/
  const configContext = path.join(context, 'config')

  resolveWithoutFile({
    name,
    normalModuleFactory,
    getRequestData: request => request.match(configRegExp),
    getNewRequest: x => {
      const [, configRequest] = x
      return configRequest !== productName &&
        path.join(configContext, `${configRequest}.json`)
    },
    createLoader: _ => ({
      loader: require.resolve('../loaders/object-loader'),
      options: { object: config },
    })
  })
}
