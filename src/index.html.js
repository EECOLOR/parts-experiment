import React from 'react'
import Document from 'part:document'
import ReactDom from 'react-dom/server'
import docs from '-!raw-loader!all:document'
import importFresh from 'import-fresh'

const manifest = importFresh('./manifest.json')
const assets = Object.entries(manifest).reduce(
  (result, [name, file]) => {
    const [extension] = name.split('.').slice(-1)
    return { ...result, [extension]: [...(result[extension] || []), file] }
  },
  { js: [], css: [] }
)

export default (
  '<!doctype html>' +
  ReactDom.renderToStaticMarkup(
    <Document docs={docs.map(x => x.default)} assets={assets} />
  )
)
