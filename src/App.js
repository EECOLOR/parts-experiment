import React from 'react'
import styles from './App.css'

export default function App({ results }) {
  return (
    <div>
      <p className={styles.red}>I am the app</p>
      <p className={styles.color}>I am the color</p>
      {results.reduce((result, x) => result && x.success, true)
        ? <h3 style={{color: 'green'}}>Success</h3>
        : <h3 style={{color: 'red'}}>Failure</h3>
      }
      {results.map(({ success, versions }, i) =>
        <div key={i} style={{ display: 'flex', flexDirection: 'row', color: success ? 'green' : 'red' }}>
          {versions.map((x, i) => <pre key={i} style={{ margin: '20px' }}><code>{x}</code></pre>)}
        </div>
      )}
    </div>
  )
}
