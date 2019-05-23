const importFresh = require('import-fresh')
const path = require('path')

module.exports = { loadParts }

async function loadParts({
  context,
  configFileName /* 'sanity.json' */,
  pluginPackagePrefix /* sanity-plugin- */,
}) {
  const resolvedConfig = resolveInContext(`./${configFileName}`, context)
  const collectedParts = await collectParts({ resolvedConfig, pluginPackagePrefix })
  const resolvedParts = await resolveParts(collectedParts)
  return resolvedParts
}

async function collectParts({ resolvedConfig, pluginPackagePrefix, isModule = false }) {
  const [context, configFileName] = [path.dirname(resolvedConfig), path.basename(resolvedConfig)]
  const {
    paths: {
      source = throwError(`The object in key 'parts' should have a key 'source' in ${resolvedConfig}`),
      compiled = throwError(`The object in key 'parts' should have a key 'compiled' in ${resolvedConfig}`)
    } = { source: '', compiled: '' },
    parts = [],
    plugins = [],
  } = importFresh(resolvedConfig)

  if (!Array.isArray(parts)) throwError(`The key 'parts' should be an array in ${resolvedConfig}`)
  if (!Array.isArray(plugins)) throwError(`The key 'plugin' should be an array in ${resolvedConfig}`)

  const partsFromPlugins =
    await plugins.map(async pluginRequest => {
      const moduleRequest = pluginRequest.startsWith('@') || pluginRequest.startsWith(pluginPackagePrefix)
      const [isModule, pluginConfig] =
        (moduleRequest && [true, resolveInContext(`${pluginRequest}/${configFileName}`, context)]) ||
        attempt(() => [false, resolveInContext(`./plugins/${pluginRequest}/${configFileName}`, context)]) ||
        attempt(() => [true, resolveInContext(`${pluginPackagePrefix}${pluginRequest}/${configFileName}`, context)]) ||
        throwError(`Could not find plugin '${pluginRequest}' from ${context}`)

      return collectParts({ resolvedConfig: pluginConfig, pluginPackagePrefix, isModule })
    })

  const partsFromConfig = parts.map(part => {
    if (!part || typeof part !== 'object') throwError(`Expected each part to be an object in ${resolvedConfig}`)
    const { name, description, implements, path, type } = part
    return {
      name: name && getPartname(name),
      description,
      implements: implements && getPartname(implements),
      type,
      path: path && (
        path.startsWith('.')
        ? path
        : isModule
        ? `${compiled}${path}`
        : `${source}${path}`
      ),
      source: resolvedConfig,
      context,
    }
  })

  return [].concat(...partsFromPlugins).concat(partsFromConfig)

  function getPartname(name) {
    return name.startsWith('part:')
      ? name.slice(5)
      : throwError(`Part '${name}' should be renamed to 'part:${name}' (defined in ${resolvedConfig})`)
  }
}

function resolveParts(parts) {
  return parts.reduce(
    (result, { name, implements, type, path: implementation, context, source, description }) => {
      if (name && result[name]) throwError(`Illegal definition of '${name}' in ${c(source)}, a part with this name was already defined in ${c(result[name].source)}`)
      if (implements && type) throwError(`Illegal property 'type' in implementation of '${implements}' in ${c(source)}`)
      if (implements && !implementation) throwError(`Missing property 'implementation' in implementation of '${implements}' in ${c(source)}'`)
      if (implements && !result[implements]) throwError(`No part with name '${implements}' found for the implementation defined in ${c(source)}`)

      const resolvedImplementation = implementation && {
        path: resolveInContext(implementation, context),
        source,
      }

      if (name)
        result[name] = {
          name,
          type: type && resolveInContext(type, context),
          implementations: [resolvedImplementation].filter(Boolean),
          source,
          description,
        }

      if (implements)
        result[implements].implementations.push(resolvedImplementation)

      return result

      function c(x) { return x.replace(context, '') }
    },
    {}
  )
}

function attempt(f) { try { return f() } catch (e) {} }

function resolveInContext(request, context) {
  return require.resolve(request, { paths: [context] })
}

function throwError(message) { throw new Error(message) }
