import React from 'react'

export default function DefaultDocument({ docs, assets }) {
  const x = (
    <html>
      <head>
        {assets.css.map(x => <link key={x} rel="stylesheet" href={x} />)}
        {assets.js.map(x => <script key={x} defer src={x} />)}
      </head>
      <body>
        <div id='app' />
        {docs.map((doc, i) => <pre key={i}><code>{doc}</code></pre>)}
      </body>
    </html>
  )
  return x
}