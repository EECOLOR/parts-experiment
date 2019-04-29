import a, { test } from 'part:one'
import b from 'part:two'

// import 'part:three' // No implementations available for part 'three'
// import 'part:four' // No part declared with the name 'four'

import c from 'optional:three'
// import 'optional:four' // No part declared with the name 'four'
import d from 'optional:one'

import e from 'all:one'
import f from 'all:three'
// import 'all:four' // No part declared with the name 'four'
import g from 'all:five'

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

console.log('-- test --')
console.log({ test: 'one-default' }, a)
console.log('one-test', test)
console.log({ key: { value: 'two-default' } }, b)
console.log(null, c)
console.log({ test: 'one-default' }, d && d.default)
console.log('one-test', d && d.test)
console.log([{ default: { test: 'one-default' }, test: 'one-test' }], e.map(x => ({ ...x })))
console.log([], f)
console.log([{ default: 'five-1' }, { default: 'five-2' }], g.map(x => ({ ...x })))

const element = document.getElementById('app')
ReactDOM.render(<App />, element)

if (module.hot) {
  module.hot.accept('./App.js', () => { ReactDOM.hydrate(<App />, element) })
}
