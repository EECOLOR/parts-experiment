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
    name: 'two', // note to self: should this be 'implements'?
                 //   if we choose to have that, things might get more complicated. Reexporting a part
                 //   can still be done with this setup by creating a new part with it's own type.
                 //   check https://www.sanity.io/docs/extending/parts
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
    name: 'five',
    implementation: './src/five-1.js'
  },
  {
    name: 'five',
    implementation: './src/five-2.js'
  }
]