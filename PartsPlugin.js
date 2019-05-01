
// note to self: once you have a reasonably clean version, please create a branch that implements
//   full backwards compatibility (if possible) and see how much complexity is introduced
// https://www.sanity.io/docs/extending/parts


const path = require('path')
const fs = require('fs-extra')

module.exports = function PartsPlugin({ generateTypeDefinitionFiles = false } = {}) {
  return {
    apply: compiler => {
      const partsPluginName = 'PartsPlugin'
      const partsParamName = `${partsPluginName} - parts`

      const { beforeCompile } = compiler.hooks
      // make sure this one is first, it exposes parts for the other hooks
      beforeCompile.tapPromise(partsPluginName, resolveParts)
      if (generateTypeDefinitionFiles) beforeCompile.tapPromise(partsPluginName, writePartTypeDefinitions)
      beforeCompile.tap(partsPluginName, addPartsResolver)

      async function resolveParts(params) {
        const { context } = compiler
        const resolveContext = { paths: [context] }

        const partsPath = require.resolve('./parts', resolveContext)
        const parts = removeFromCacheAndRequire(partsPath)

        // https://webpack.js.org/api/compiler-hooks/#beforecompile
        params[partsParamName] = parts.reduce(
          (result, { name, type, implementation }) => {
            const entry = result[name] || (result[name] = { name, implementations: [] })
            if (type && entry.type && entry.type !== type) throw new Error(`Two parts with the name '${name}' are defined`)
            if (type) entry.type = require.resolve(type, resolveContext)
            if (implementation) entry.implementations.push(require.resolve(implementation, resolveContext))
            return result
          },
          {}
        )
      }

      async function writePartTypeDefinitions({ [partsParamName]: parts }) {
        const targetDir = path.resolve(compiler.context, '.partTypes')
        await fs.remove(targetDir)
        await Promise.all(
          Object.values(parts).map(async ({ name, type }) => {
            if (type) {
              const partsDir = path.resolve(targetDir, 'parts')
              const optionalPartsDir = path.resolve(targetDir, 'optionalParts')
              const allPartsDir = path.resolve(targetDir, 'allParts')
              await Promise.all([
                fs.copy(type, path.resolve(partsDir, `${name}.d.ts`)), // security issue here, if name contains / or ../
                fs.mkdirs(optionalPartsDir).then(_ =>
                  fs.writeFile(path.resolve(optionalPartsDir, `${name}.d.ts`), `
                    declare const _export: (typeof import('part:${name}')) | null;
                    export = _export;
                  `)
                ),
                fs.mkdirs(allPartsDir).then(_ =>
                  fs.writeFile(path.resolve(allPartsDir, `${name}.d.ts`), `
                    declare const _export: Array<typeof import('part:${name}')>;
                    export = _export;
                  `)
                )
              ])
            }
          })
        )
      }

      function addPartsResolver({ normalModuleFactory, [partsParamName]: parts }) {
        normalModuleFactory.hooks.resolver.tap(
          partsPluginName,
          original => async (data, callback) => {
            try { // if you return a promise to a function that does not expect one, make sure it always completes without loosing errors
              const { request } = data
              const [resourceRequest] = request.split('!').slice(-1)
              const partsRequestInfo = getPartsResourceInfo(resourceRequest)
              if (partsRequestInfo) {
                const partName = partsRequestInfo.name
                const part = parts[partName]
                if (!part) return callback(new Error(`No part declared with the name '${partName}'`))

                if (partsRequestInfo.isPartRequest) {
                  if (!part.implementations.length) return callback(new Error(`No implementations available for part '${partName}'`))
                  const [implementation] = part.implementations.slice(-1)
                  original({ ...data, request: request.replace(resourceRequest, implementation) }, callback)
                } else {
                  const result = {
                    request, userRequest: request, rawRequest: request, resource: request,
                    loaders: [createPartLoader(part, partsRequestInfo)],
                    type: 'javascript/auto',
                    parser: normalModuleFactory.getParser('javascript/auto'),
                    generator: normalModuleFactory.getGenerator('javascript/auto'),
                    resolveOptions: {
                      isPartRequest: true
                    },
                  }
                  callback(null, result)
                }
              } else  original(data, callback)
            } catch (e) { callback(e) }
          }
        )
        normalModuleFactory.hooks.module.tap(partsPluginName, (module, result) => {
          // context of a normal module is extracted from the request, so we need to adjust it
          if (result.resolveOptions.isPartRequest) module.context = result.context
        })

        function getPartsResourceInfo(resource) {
          const isPart = resource.startsWith('part:') && resource.slice(5)
          const isOptionalPartRequest =
            (isPart && isPart.slice(-1) === '?' && isPart.slice(0, -1)) ||
            (resource.startsWith('optional:') && resource.slice(9))
          const isPartRequest = !isOptionalPartRequest && isPart
          const isAllPartsRequest = resource.startsWith('all:') && resource.slice(4)

          const name = (isPartRequest || isOptionalPartRequest || isAllPartsRequest)
          return name &&
            { isPartRequest, isOptionalPartRequest, isAllPartsRequest, name, resource }
        }
      }

      function createPartLoader(part, partsRequestInfo) {
        return {
          loader: path.resolve(compiler.context, 'load-part'), // add a loader for this resource
          options: { part, partsRequestInfo } // make sure the loader knows what part is required
        }
      }
    }
  }
}

// might want to switch to `import-fresh`
function removeFromCacheAndRequire(path) {
  delete require.cache[path] // https://nodejs.org/docs/latest-v10.x/api/modules.html#modules_require_cache
  return require(path)
}
