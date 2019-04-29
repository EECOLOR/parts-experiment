import React from 'react'

export default function DefaultDocument({ assets }) {
  const x = (
    <html>
      <head>
        {assets.css.map(x => <link key={x} rel="stylesheet" href={x} />)}
        {assets.js.map(x => <script key={x} defer src={x} />)}
      </head>
      <body>
        <div id='app' />
      </body>
    </html>
  )
  return x
}