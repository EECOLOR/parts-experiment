const { partsParamName } = require('./PartsProviderPlugin')

const name = 'PartsResolverPlugin'

PartsResolverPlugin.getResolve = getResolve
module.exports = PartsResolverPlugin

function PartsResolverPlugin({
  optional_allowEsModule, // see part-loader for details
  all_onlyDefaultWhenEsModule,
}) {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(name, compilation)

      function compilation(compilation, { normalModuleFactory, [partsParamName]: parts }) {
        addPartsResolver(normalModuleFactory, parts, optional_allowEsModule, all_onlyDefaultWhenEsModule)
        addGetPartsResourceInfoToLoaderContext(compilation, parts)
      }
    }
  }
}

function addPartsResolver(normalModuleFactory, parts, optional_allowEsModule, all_onlyDefaultWhenEsModule) {
  normalModuleFactory.hooks.resolver.tap(
    name,
    original => async (data, callback) => {
      try { // if you return a promise to a function that does not expect one, make sure it always completes without loosing errors
        const { request } = data
        const partsResourceInfo = getPartsResourceInfo(request, parts)
        if (partsResourceInfo) {
          const { isSinglePartRequest, isOptionalPartRequest, hasImplementation, getRequestWithImplementation } = partsResourceInfo

          if (isSinglePartRequest || (optional_allowEsModule && isOptionalPartRequest && hasImplementation))
            original({ ...data, request: getRequestWithImplementation() }, callback)
          else {
            const result = {
              request, userRequest: request, rawRequest: request, resource: request,
              loaders: [{
                loader: require.resolve('../loaders/part-loader'),
                options: { partsResourceInfo, all_onlyDefaultWhenEsModule, optional_allowEsModule },
              }],
              type: 'javascript/auto',
              parser: normalModuleFactory.getParser('javascript/auto'),
              generator: normalModuleFactory.getGenerator('javascript/auto'),
              resolveOptions: { isPartLoaderRequest: true },
              settings: {},
            }
            callback(null, result)
          }
        } else  original(data, callback)
      } catch (e) { callback(e) }
    }
  )
  normalModuleFactory.hooks.module.tap(name, (module, result) => {
    // context of a normal module is extracted from the request, so we need to adjust it
    if (result.resolveOptions && result.resolveOptions.isPartLoaderRequest)
      module.context = result.context
  })
}

function addGetPartsResourceInfoToLoaderContext(compilation, parts) {
  // this plugin will be moved in webpack v5 (while the documentation states it will be removed...) -> https://github.com/webpack/webpack.js.org/pull/2988
  compilation.hooks.normalModuleLoader.tap(name, (loaderContext, module) => {
    loaderContext.getPartsResourceInfo = request => getPartsResourceInfo(request, parts)
  })
}

function getResolve(loaderContext) {
  const resolve = loaderContext.getResolve()
  const { getPartsResourceInfo } = loaderContext

  return async (context, file) => {
    const { isSinglePartRequest, getRequestWithImplementation } = getPartsResourceInfo(file) || {}
    const request = isSinglePartRequest ? getRequestWithImplementation() : file
    return resolve(context, request)
  }
}

function getPartsResourceInfo(request, parts) {
  const [resource] = request.split('!').slice(-1)
  const isPart = resource.startsWith('part:') && resource.slice(5)
  const isOptionalPartRequest =
    (isPart && isPart.slice(-1) === '?' && isPart.slice(0, -1)) ||
    (resource.startsWith('optional:') && resource.slice(9))
  const isSinglePartRequest = !isOptionalPartRequest && isPart
  const isAllPartsRequest =
    (resource.startsWith('all:part:') && resource.slice(9)) ||
    (resource.startsWith('all:') && resource.slice(4))

  const name = (isSinglePartRequest || isOptionalPartRequest || isAllPartsRequest)
  const part = name && (parts[name] || throwError(`No part declared with the name '${name}'`))
  const hasImplementation = part && part.implementations.length
  return name &&
    {
      isSinglePartRequest,
      isOptionalPartRequest,
      isAllPartsRequest,
      name,
      resource,
      part,
      hasImplementation,
      getRequestWithImplementation: () => {
        if (!hasImplementation) throwError(`No implementations available for part '${name}'`)
        const [implementation] = part.implementations.slice(-1)
        return request.replace(resource, implementation)
      }
    }
}

function throwError(message) { throw new Error(message) }
