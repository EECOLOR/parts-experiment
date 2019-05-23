module.exports = { resolveWithoutFile }

function resolveWithoutFile({
  name,
  normalModuleFactory,
  getRequestData,
  createLoader,
  getNewRequest = _ => '',
}) {
  normalModuleFactory.hooks.resolver.tap(
    name,
    original => (data, callback) => {
      const { request } = data

      const requestData = getRequestData(request)
      if (requestData) {
        const newRequest = getNewRequest(requestData)
        if (newRequest) original({ ...data, request: newRequest }, callback)
        else {
          const result = {
            request, userRequest: request, rawRequest: request, resource: request,
            loaders: [createLoader(requestData)],
            type: 'javascript/auto',
            parser: normalModuleFactory.getParser('javascript/auto'),
            generator: normalModuleFactory.getGenerator('javascript/auto'),
            resolveOptions: { adjustModuleContext: true },
            settings: {},
            context: data.context,
          }
          callback(null, result)
        }
      } else  original(data, callback)
    }
  )
  normalModuleFactory.hooks.module.tap(name, (module, result) => {
    // context of a normal module is extracted from the request, so we need to adjust it
    if (result.resolveOptions && result.resolveOptions.adjustModuleContext)
      module.context = result.context
  })
}
