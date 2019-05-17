const PartsProviderPlugin = require('./PartsProviderPlugin')
const PartsResolverPlugin = require('./PartsResolverPlugin')
const PartsTypeDefinitionPlugin = require('./PartsTypeDefinitionPlugin')

PartsPlugin.getResolve = PartsResolverPlugin.getResolve
module.exports = PartsPlugin

function PartsPlugin({
  generateTypeDefinitionFiles = false,
  loadParts,
  optional_allowEsModule, // see part-loader for details
  all_onlyDefaultWhenEsModule,
}) {
  return {
    apply: compiler => {
      [
        PartsProviderPlugin({ loadParts }),
        PartsResolverPlugin({ optional_allowEsModule, all_onlyDefaultWhenEsModule }), // see part-loader for details
        generateTypeDefinitionFiles && PartsTypeDefinitionPlugin(),
      ].filter(Boolean).forEach(x => { x.apply(compiler) })
    }
  }
}
