/**
 * Provides parts for other plugins.
 *
 * Use the exported `partsParamName` to access the param in the compilation params.
 */

const name = 'PartsProviderPlugin'
const partsParamName = `${name} - parts`

PartsProviderPlugin.partsParamName = partsParamName
module.exports = PartsProviderPlugin

function PartsProviderPlugin({ loadParts }) {
  return {
    apply: compiler => {
      compiler.hooks.beforeCompile.tapPromise({ name, stage: 1 }, providePartsToCompilationParams)
      compiler.hooks.compilation.tap(name, providePartsToChildCompilers)

      async function providePartsToCompilationParams(params) {
        if (params[partsParamName]) return
        const context = compiler.context
        const parts = await loadParts(context)
        // https://webpack.js.org/api/compiler-hooks/#beforecompile
        params[partsParamName] = parts
      }

      function providePartsToChildCompilers(compilation, { normalModuleFactory, [partsParamName]: parts }) {
        compilation.hooks.childCompiler.tap(name, (childCompiler, compilerName, compilerIndex) => {
          childCompiler.hooks.beforeCompile.tap({ name, stage: 0 }, params => {
            params[partsParamName] = parts
          })
        })
      }
    }
  }
}
