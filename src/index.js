import a, { test } from 'part:one'
import b from 'part:two'

// import 'part:three' // No implementations available for part 'three'
// import 'part:four' // No part declared with the name 'four'

import c from 'optional:three'
import c1 from 'part:three?'

// import 'optional:four' // No part declared with the name 'four'
import d from 'optional:one'
import d1 from 'part:one?'

import e from 'all:one'
import e1 from 'all:part:one'
import f from 'all:three'
import f1 from 'all:part:three'

// import 'all:four' // No part declared with the name 'four'
import g from 'all:five'
import g1 from 'all:part:five'

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

console.log('-- test --')
const results = [
  compare({ test: 'one-default' }, a),
  compare('one-test', test),
  compare({ key: { value: 'two-default' } }, b),
  compare(undefined, c, c1),
  ...(BACKWARDS_COMPATIBLE
    ? [
      compare({ test: 'one-default' }, d, d1),
      compare('one-default', d && d.test, d1 && d1.test),
    ]
    : [
      compare({ test: 'one-default' }, d && d.default, d1 && d1.default),
      compare('one-test', d && d.test, d1 && d1.test),
    ]
  ),
  compare([{ default: { test: 'one-default' }, test: 'one-test' }], e.map(x => ({ ...x })), e1.map(x => ({ ...x }))),
  compare([], f, f1),
  compare([{ default: 'five-1' }, { default: 'five-2' }], g.map(x => ({ ...x })), g1.map(x => ({ ...x }))),
]

function createApp() { return <App results={results} />}

const element = document.getElementById('app')
ReactDOM.render(createApp(), element)

if (module.hot) {
  module.hot.accept('./App.js', () => { ReactDOM.hydrate(createApp(), element) })
}

function compare(...args) {
  const X = Symbol('initial value')
  const { previous, ...rest } = args.reduce(
    (result, x) => {
      const { previous, versions } = result
      const prepared = prepare(x)
      return previous === X
        ? { previous: prepared, success: true, versions: [JSON.stringify(x, null, 2)] }
        : previous === prepared
        ? result
        : { previous, success: false, versions: [...versions, JSON.stringify(x, null, 2)] }
    },
    { previous: X, success: true, versions: [] }
  )

  return rest
}

function prepare(x) {
  return JSON.stringify(
    typeof x === 'object' && x
      ? (Array.isArray(x)
        ? x.map(prepare)
        : Object.entries(x).sort(([a], [b]) => a.localeCompare(b)).reduce(
            (result, [k, v]) => ({ ...result, [k]: prepare(v) }),
            {}
          )
      )
      : x
  )
}
