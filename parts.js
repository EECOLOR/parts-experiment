// not all combinations are present, in a final version (or actually it's tests) they should be
module.exports = [
  {
    name: 'one',
    type: './src/one.d.ts',
    path: './src/one.js'
  },
  {
    name: 'two',
    type: './src/two.d.ts',
  },
  {
    implements: 'two',
    path: './src/two.js'
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
    path: './src/five-1.js'
  },
  {
    implements: 'five',
    path: './src/five-2.js'
  },
  {
    name: 'document',
    type: './src/Document.d.ts',
    path: './src/DefaultDocument.js'
  },
  {
    name: 'color',
    path: './src/DefaultColor.css'
  },
  {
    name: 'green',
    path: './src/green.css'
  },
  {
    name: 'purple',
  },
  {
    implements: 'purple',
    name: 'purple-default',
    path: './src/purple.css'
  }
]