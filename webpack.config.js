const path = require('path')
const fs = require('fs-extra')

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
        // make sure this one is first, it exposes parts for the other hooks
        beforeCompile.tapPromise(partsPluginName, resolveParts)
        beforeCompile.tapPromise(partsPluginName, writePartTypeDefinitions)
        beforeCompile.tap(partsPluginName, exposePartsToResolver)
        resolveOptions.for('normal').tap(partsPluginName, addPartResolverPluginToResolveOptions)
        beforeCompile.tap(partsPluginName, addPartLoaderAfterResolve)

        async function resolveParts(params) {
          const { context } = compiler
          const resolveContext = { paths: [context] }

          const partsPath = require.resolve('./parts', resolveContext)
          const parts = removeFromCacheAndRequire(partsPath)

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
              if (type) await fs.copy(type, path.resolve(targetDir, 'parts', `${name}.d.ts`)) // security issue here, if name contains / or ../
            })
          )
        }

        function exposePartsToResolver({ normalModuleFactory, [partsParamName]: parts }) {
          normalModuleFactory.hooks.beforeResolve.tap(
            partsPluginName,
            x => (x.resolveOptions[partsParamName] = parts, x)
          )
        }

        function addPartResolverPluginToResolveOptions({ [partsParamName]: parts, ...options}) {
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
            if (innerRequest.startsWith('part')) {
              const [,partName] = innerRequest.split(':')
              const part = parts[partName]
              if (!part) throw new Error(`No part declared with the name '${partName}'`)
              if (!part.implementations.length) throw new Error(`No implementations available for part '${partName}'`)
              return { path: innerRequest }
            }
          }
        }

        function addPartLoaderAfterResolve({ normalModuleFactory, [partsParamName]: parts }) {
          normalModuleFactory.hooks.afterResolve.tap(
            partsPluginName,
            injectPartLoaderIfPart
          )

          function injectPartLoaderIfPart(data) {
            const { request } = data
            if (request && request.startsWith('part')) {
              const [, partName] = request.split(':')
              return {
                ...data,
                loaders: [createPartLoader(parts[partName])]
              }
            }
          }
        }

        function createPartLoader(part) {
          return {
            loader: path.resolve(compiler.context, 'load-part'), // add a loader for this resource
            options: { part } // make sure the loader knows what part is required
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
