const path = require('path')
const fs = require('fs-extra')

// note to self: once you have a reasonably clean version, please create a branch that implements
//   full backwards compatibility (if possible) and see how much complexity is introduced
// https://www.sanity.io/docs/extending/parts

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    {
      apply: compiler => {
        const partsPluginName = 'PartsPlugin'
        const partsParamName = `${partsPluginName} - parts`

        const { beforeCompile } = compiler.hooks
        const { resolveOptions } = compiler.resolverFactory.hooks
        // make sure this one is first, it exposes parts for the other hooks (this can be changed later)
        beforeCompile.tapPromise(partsPluginName, resolveParts)
        beforeCompile.tapPromise(partsPluginName, writePartTypeDefinitions)
        beforeCompile.tap(partsPluginName, exposePartsToResolver)
        resolveOptions.for('normal').tap(partsPluginName, addPartResolverPluginToResolveOptions) // do we even need this? could we skip resolution altogether by hooking into the normal module factory?
        beforeCompile.tap(partsPluginName, addPartLoaderAfterResolve)

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

        async function writePartTypeDefinitions(params) {
          const targetDir = path.resolve(compiler.context, '.partTypes')
          await fs.remove(targetDir)
          await Promise.all(
            Object.values(params[partsParamName]).map(async ({ name, type }) => {
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

        function exposePartsToResolver({ normalModuleFactory, [partsParamName]: parts }) {
          normalModuleFactory.hooks.beforeResolve.tap(
            partsPluginName,
            x => ({ ...x, resolveOptions: { ...x.resolveOptions, [partsParamName]: parts } })
          )
        }

        function addPartResolverPluginToResolveOptions({ [partsParamName]: parts, ...options }) {
          return {
            ...options,
            plugins: [
              ...(options.plugins || []),
              createPartResolverPlugin(parts)
            ]
          }
        }

        function createPartResolverPlugin(parts) {
          return { apply: resolver => { resolver.hooks.resolve.tap(partsPluginName, resolveIfPart) } }

          function resolveIfPart(request, resolveContext) {
            const innerRequest = request.request
            const partsRequestType = getPartsRequestType(innerRequest)
            if (partsRequestType) {
              const [,partName] = innerRequest.split(':')
              const part = parts[partName]
              if (!part) throw new Error(`No part declared with the name '${partName}'`)
              if (partsRequestType.isPartRequest && !part.implementations.length) throw new Error(`No implementations available for part '${partName}'`)
              return { path: innerRequest, partsRequestType, part }
            }
          }

          function getPartsRequestType(request) {
            const isPartRequest = request.startsWith('part:')
            const isOptionalPartRequest = request.startsWith('optional:')
            const isAllPartsRequest = request.startsWith('all:')

            return (isPartRequest || isOptionalPartRequest || isAllPartsRequest) &&
              { isPartRequest, isOptionalPartRequest, isAllPartsRequest }
          }
        }

        function addPartLoaderAfterResolve({ normalModuleFactory, [partsParamName]: parts }) {
          normalModuleFactory.hooks.afterResolve.tap(
            partsPluginName,
            injectPartLoaderIfPart
          )

          function injectPartLoaderIfPart(data) {
            const { resourceResolveData: { path, partsRequestType, part } } = data
            if (path && partsRequestType && part) {
              return {
                ...data,
                loaders: [createPartLoader(part, partsRequestType)]
              }
            }
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
  ]
}

function removeFromCacheAndRequire(path) {
  delete require.cache[path] // https://nodejs.org/docs/latest-v10.x/api/modules.html#modules_require_cache
  return require(path)
}
