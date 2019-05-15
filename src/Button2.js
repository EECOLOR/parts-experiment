import React from 'react'
import styles from 'part:green'

export default function Button({ children }) {
  return <button className={styles.green}>|~{children}~|</button>
}