const { partsParamName } = require('./PartsProviderPlugin')

const path = require('path')
const fs = require('fs-extra')

module.exports = PartsTypeDefinitionPlugin

const name = 'PartsTypeDefinitionPlugin'

function PartsTypeDefinitionPlugin() {
  return {
    apply: compiler => {
      let partsToEmit

      compiler.hooks.compilation.tap(name, compilation)
      compiler.hooks.emit.tapPromise(name, emit)

      function compilation(compilation, { normalModuleFactory, [partsParamName]: parts }) {
        partsToEmit = parts
      }

      async function emit(compilation) {
        await writePartTypeDefinitions(compiler.context, partsToEmit)
      }
    }
  }
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
