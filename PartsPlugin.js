
// note to self: once you have a reasonably clean version, please create a branch that implements
//   full backwards compatibility (if possible) and see how much complexity is introduced
// https://www.sanity.io/docs/extending/parts

const path = require('path')
const fs = require('fs-extra')
const importFresh = require('import-fresh')

module.exports = PartsPlugin

const name = 'PartsPlugin'
const partsParamName = `${name} - parts`

async function loadPartsJs(context) {
  const source = resolve('./parts', context)
  // TODO: resolve from plugins
  return importFresh(source).map(x => ({ ...x, source }))
}
async function loadSanityParts(context) {
  const source = resolve('./sanity.json', context)
  // TODO: resolve from plugins - resolve from defined paths

  return importFresh(source)
    .parts
    .reduce(
      (result, { name, implements, path }) => [
        ...result,
        {
          name: name && name.slice(5),
          implements: implements && implements.slice(5),
          path,
          source
        }
      ],
      []
    )
}

PartsPlugin.getResolve = getResolve
function PartsPlugin({
  generateTypeDefinitionFiles = false,
  backwardsCompatible = true,
  loadParts = backwardsCompatible ? loadSanityParts : loadPartsJs
} = {}) {
  return {
    apply: compiler => {
      let partsToEmit

      compiler.hooks.beforeCompile.tapPromise({ name, stage: 1 }, beforeCompile)
      compiler.hooks.compilation.tap(name, compilation)
      if (generateTypeDefinitionFiles)
        compiler.hooks.emit.tapPromise(name, emit)

      async function beforeCompile(params) {
        if (params[partsParamName]) return
        const context = compiler.context
        const parts = await loadParts(context)
        const resolvedParts = await resolveParts(parts, context)
        // https://webpack.js.org/api/compiler-hooks/#beforecompile
        params[partsParamName] = resolvedParts
        partsToEmit = resolvedParts
      }

      function compilation(compilation, { normalModuleFactory, [partsParamName]: parts }) {
        addPartsResolver(normalModuleFactory, parts, backwardsCompatible)
        addGetPartsResourceInfoToLoaderContext(compilation, parts)
        providePartsToChildCompilers(compilation, parts)
      }

      async function emit(compilation) {
        await writePartTypeDefinitions(compiler.context, partsToEmit)
      }
    }
  }
}

async function resolveParts(parts, context) {
  return parts.reduce(
    (result, { name, implements, type, path: implementation, source }) => {
      if (name && result[name]) throwError(`Illegal definition of '${name}' in ${c(source)}, a part with this name was already defined in ${c(existingEntry.source)}`)
      if (implements && type) throwError(`Illegal property 'type' in implementation of '${implements}' in ${c(source)}`)
      if (implements && !implementation) throwError(`Missing property 'implementation' in implementation of '${implements}' in ${c(source)}'`)
      if (implements && !result[implements]) throwError(`No part with name '${implements}' found for the implementation defined in ${c(source)}`)

      const resolvedImplementation = implementation && resolve(implementation, context)

      if (name)
        result[name] = {
          name,
          type: type && resolve(type, context),
          implementations: [resolvedImplementation].filter(Boolean),
          source,
        }

      if (implements)
        result[implements].implementations.push(resolvedImplementation)

      return result
    },
    {}
  )

  function c(x) { return x.replace(context, '') }
}

function resolve(path, context) { return require.resolve(path, { paths: [context] }) }

function addPartsResolver(normalModuleFactory, parts, backwardsCompatible) {
  normalModuleFactory.hooks.resolver.tap(
    name,
    original => async (data, callback) => {
      try { // if you return a promise to a function that does not expect one, make sure it always completes without loosing errors
        const { request } = data
        const partsResourceInfo = getPartsResourceInfo(request, parts)
        if (partsResourceInfo) {
          const { isSinglePartRequest, isOptionalPartRequest, hasImplementation, getRequestWithImplementation } = partsResourceInfo

          if (isSinglePartRequest || (backwardsCompatible && isOptionalPartRequest && hasImplementation))
            original({ ...data, request: getRequestWithImplementation() }, callback)
          else {
            const result = {
              request, userRequest: request, rawRequest: request, resource: request,
              loaders: [{
                loader: require.resolve('./part-loader'),
                options: { partsResourceInfo, backwardsCompatible },
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

function providePartsToChildCompilers(compilation, parts) {
  compilation.hooks.childCompiler.tap(name, (childCompiler, compilerName, compilerIndex) => {
    childCompiler.hooks.beforeCompile.tap({ name, stage: 0 }, params => {
      params[partsParamName] = parts
    })
  })
}

async function writePartTypeDefinitions(context, parts) {
  const targetDir = path.resolve(context, '.partTypes')
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
