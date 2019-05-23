module.exports = {
  pitch(remainingRequest, precedingRequest, data) {
    const { object } = this.query
    return `module.exports = ${JSON.stringify(object)}`
  }
}
