// not all combinations are present, in a final version (or actually it's tests) they should be
module.exports = [
  {
    name: 'one',
    type: './src/one.d.ts',
    implementation: './src/one.js'
  },
  {
    name: 'two',
    type: './src/two.d.ts',
  },
  {
    implements: 'two',
    implementation: './src/two.js'
  },
  {
    name: 'three',
    type: './src/three.d.ts'
  },
  {
    name: 'five',
    type: './src/five.d.ts'
  },
  {
    implements: 'five',
    implementation: './src/five-1.js'
  },
  {
    implements: 'five',
    implementation: './src/five-2.js'
  },
  {
    name: 'document',
    type: './src/Document.d.ts',
    implementation: './src/DefaultDocument.js'
  },
  {
    name: 'color',
    implementation: './src/DefaultColor.css'
  },
  {
    name: 'green',
    implementation: './src/green.css'
  },
  {
    name: 'purple',
  },
  {
    implements: 'purple',
    name: 'purple-default',
    implementation: './src/purple.css'
  }
]