const path = require('path')
const importFresh = require('import-fresh')
const { loadParts } = require('./resolver')

const productName = 'sanity'

const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf'
}

module.exports = { createConfig }

function createConfig({ defaultContext, configEnv }) {
  const context = process.env.STUDIO_BASEPATH || defaultContext
  const sanityEnv = process.env.SANITY_ENV || 'production'

  const configFileName = `${productName}.json`
  const sanityJson = importFresh(require.resolve(configFileName, { paths: [context] }))

  const config = [
    sanityJson,
    (x => (x && x[configEnv]) || {})(sanityJson.env), // https://github.com/tc39/proposal-pipeline-operator
    (x => x ? { api: { apiHost: x } } : {})(apiHosts[sanityEnv]),
    { project: { basePath:  context } },
  ].reduce(mergeDeep, {})

  return {
    context,
    productName,
    outputPath: path.resolve(context, 'dist'),
    publicPath: sanityJson.project.basePath,
    compatibility: {
      optional_allowEsModule: true,
      all_onlyDefaultWhenEsModule: true,
      ...sanityJson.compatibility,
    },
    loadParts: context => loadParts({
      context,
      configFileName,
      pluginPackagePrefix: `${productName}-plugin-`
    }),
    config,
  }
}

function mergeDeep(target, source) {
  return Object.keys(source).reduce((result, key) => {
    const targetValue = result[key]
    const sourceValue = source[key]

    if (canMerge(targetValue, sourceValue)) {
      result[key] = mergeDeep(targetValue, sourceValue)
    } else if (canConcat(targetValue, sourceValue)) {
      result[key] = targetValue.concat(sourceValue)
    } else if (shouldClone(sourceValue)) {
      result[key] = mergeDeep({}, sourceValue)
    } else {
      result[key] = sourceValue
    }
    return result
  }, target)
}

function canMerge(x, y) { return isObject(x) && isObject(y) }
function canConcat(x, y) { return isArray(x) && isArray(y) }
function shouldClone(x) { return isObject(x) }
function isObject(x) {
  const constructor = getConstructor(x)
  return constructor && constructor instanceof constructor
}
function isArray(x) { return Array.isArray(x) }
function getConstructor(x) { return isObjectLike(x) && Object.getPrototypeOf(x).constructor }
function isObjectLike(x) { return typeof x === 'object' && x !== null }