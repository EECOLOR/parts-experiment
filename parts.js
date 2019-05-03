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
                 //
                 // To help prevent typos we might want to go with 'implements' if that is the
                 // intention. I would however not prevent the combination of 'name' and 'implementation'.
                 // This also helps with accidentally implementing an existing part when the intention
                 // is to declare a part.
                 //
                 // Proposed rules:
                 // - name: (required to declare a part) to declare a part with a name
                 // - implements: (required to implement a part) to reference the part that is implemented
                 // - implementation: (optional with name, required with implements) to add an implementation
                 // - type: (optional with name, forbidden with implements) to add a type definition
                 //
                 // Valid combinations:
                 // - name
                 // - name, type
                 // - name, implementation
                 // - name, type, implementation
                 // - name, implements, implementation
                 // - implements, implementation
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
    implementation: './src/purple.css'
  },
  {
    name: 'purple-default',
    implementation: './src/purple.css'
  }
]