/**
 * This is considered the public API of this package.
 *
 * While node allows you to require other files, we do not support you using them. This means that
 * if those files change their API while the API in this file remains the same it will not be
 * indicated by a version change.
 *
 * So, if you want the comfort of semver (which we will try to implement to the best of our ability)
 * please only use methods exported from this file. Open an issue on Github if you have a use-case
 * that would become possible if we export other methods.
 */

const { loadParts } = require('./loadParts')

module.exports = { loadParts }
