
// note to self: once you have a reasonably clean version, please create a branch that implements
//   full backwards compatibility (if possible) and see how much complexity is introduced
// https://www.sanity.io/docs/extending/parts


const path = require('path')
const fs = require('fs-extra')

module.exports = {
  apply: compiler => {
    const partsPluginName = 'PartsPlugin'
    const partsParamName = `${partsPluginName} - parts`

    const { beforeCompile } = compiler.hooks
    // make sure this one is first, it exposes parts for the other hooks
    beforeCompile.tapPromise(partsPluginName, resolveParts)
    beforeCompile.tapPromise(partsPluginName, writePartTypeDefinitions)
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
        original => (data, callback) => {
          const { request } = data
          const partsRequestType = getPartsRequestType(request)
          if (partsRequestType) {
            const [,partName] = request.split(':')
            const part = parts[partName]
            if (!part) return callback(new Error(`No part declared with the name '${partName}'`))
            if (partsRequestType.isPartRequest && !part.implementations.length) return callback(new Error(`No implementations available for part '${partName}'`))
            const result = {
              request, userRequest: request, rawRequest: request, resource: request,
              loaders: [createPartLoader(part, partsRequestType)],
              type: 'javascript/auto',
              parser: normalModuleFactory.getParser('javascript/auto'),
              generator: normalModuleFactory.getGenerator('javascript/auto'),
              resolveOptions: {},
            }
            return callback(null, result)
          }
          original(data, callback)
        }
      )

      function getPartsRequestType(request) {
        const isPartRequest = request.startsWith('part:')
        const isOptionalPartRequest = request.startsWith('optional:')
        const isAllPartsRequest = request.startsWith('all:')

        return (isPartRequest || isOptionalPartRequest || isAllPartsRequest) &&
          { isPartRequest, isOptionalPartRequest, isAllPartsRequest }
      }
    }

    function createPartLoader(part, partsRequestType) {
      return {
        loader: path.resolve(compiler.context, 'load-part'), // add a loader for this resource
        options: { part, partsRequestType } // make sure the loader knows what part is required
      }
    }
  }
}

// might want to switch to `import-fresh`
function removeFromCacheAndRequire(path) {
  delete require.cache[path] // https://nodejs.org/docs/latest-v10.x/api/modules.html#modules_require_cache
  return require(path)
}
