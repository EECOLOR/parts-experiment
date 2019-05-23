const { partsParamName } = require('./PartsProviderPlugin')
const { resolveWithoutFile } = require('./utils')

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
  // TODO: sanity:debug - should return the parts in a backwards compatible fashion (see /sanity/packages/@sanity/storybook/src/addons/sanity/Sanity.js)

  resolveWithoutFile({
    name,
    normalModuleFactory,
    getRequestData: request => getPartsResourceInfo(request, parts),
    getNewRequest: x => (
      x.isSinglePartRequest ||
      (optional_allowEsModule && x.isOptionalPartRequest && x.hasImplementation)
    ) && x.getRequestWithImplementation(),
    createLoader: partsResourceInfo => ({
      loader: require.resolve('../loaders/part-loader'),
      options: { partsResourceInfo, all_onlyDefaultWhenEsModule, optional_allowEsModule },
    })
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
