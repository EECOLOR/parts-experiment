import React from 'react'
import Document from 'part:document'
import ReactDom from 'react-dom/server'

delete __non_webpack_require__.cache[__non_webpack_require__.resolve('./manifest.json')]
const manifest = __non_webpack_require__('./manifest.json')
const assets = Object.entries(manifest).reduce(
  (result, [name, file]) => {
    const [extension] = name.split('.').slice(-1)
    return { ...result, [extension]: [...(result[extension] || []), file] }
  },
  { js: [], css: [] }
)
export default ('<!doctype html>' + ReactDom.renderToStaticMarkup(<Document assets={assets} />))
