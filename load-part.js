module.exports = {
  pitch(remainingRequest, precedingRequest, data) {
    const { name, implementations } = this.query.part
    const [implementation] = implementations.slice(-1)
    return `module.exports = require('${implementation}'); // ${name}`
  }
}