const path = require('path')

const name = 'ConfigResolverPlugin'

module.exports = ConfigResolverPlugin

function ConfigResolverPlugin({ baseConfigName }) {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(name, compilation)

      function compilation(compilation, { normalModuleFactory }) {
        addConfigResolver(normalModuleFactory, compiler.context, baseConfigName)
      }
    }
  }
}

function addConfigResolver(normalModuleFactory, context, baseConfigName) {
  const configRegExp = /^config:(.+)$/
  const configContext = path.join(context, 'config')

  normalModuleFactory.hooks.resolver.tap(
    name,
    original => (data, callback) => {
      const { request } = data

      const configMatch = request.match(configRegExp)
      if (configMatch) {
        const [, configRequest] = configMatch
        const configBasePath = configRequest === baseConfigName ? context : configContext
        // TODO: @sanity/util - reduceConfig (probably using a loader)
        original({ ...data, request: path.join(configBasePath, `${configRequest}.json`) }, callback)
      } else  original(data, callback)
    }
  )
}
