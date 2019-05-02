module.exports = {
  pitch(remainingRequest, precedingRequest, data) {
    const {
      part: { implementations },
      partsResourceInfo: { resource, isPartRequest, isOptionalPartRequest, isAllPartsRequest }
    } = this.query
    const [implementation] = implementations.slice(-1)

    // make sure any loaders are executed
    const r = implementation => this.remainingRequest.replace(resource, implementation)

    const result = isPartRequest
      ? throwError(`part: requests should not be handled by the loader`)
      : isOptionalPartRequest && implementation
      ? `module.exports = { ...require('${r(implementation)}') }; // ${resource}` // *
      : isOptionalPartRequest
      ? `module.exports = null; // ${resource}`
      : isAllPartsRequest
      ? `module.exports = [${implementations.map(x => `require('${r(x)}')`).join(', ')}] // ${resource}`
      : throwError('The matrix has changed, this is not a situation that should be possible. Somehow a `partsRequestType` object was created with no property set to `true`.')

    return result
   }
}

function throwError(message) { throw new Error(message) } // https://github.com/tc39/proposal-throw-expressions

/*
  This is a tricky problem to explain.

    import x from 'optional:my-part'

  Now, `x` can be `null` or `x` can be the actual implementation. So far, so good, but this seems to
  only apply to the `export default`. Take the following:

    import { x } from 'optional:my-part'

  What does the above `import` statement mean if the implementation is this:

    module.exports = null

  This would result in a similar error as `Cannot destructure property `x` of 'undefined' or 'null'`

  Theoretically it would be possible to determine (based on the type definition) the name of all
  `export` statements and return something like:

    export default null
    export const exportName0 null
    export const exportName1 null
    export const ... null

  The overhead and introduced complexity is (in my opinion) not worth it. So instead, when it's
  optional and implemented the type is simply `typeof 'my-part' | null` where we "convert" 'my-part' to:

    {
      default: ...,
      [exportName0]: ...,
      [exportName1]: ...,
      [...]: ...,
    }

  Another argument for the "simpler" approach is that this style is forced upon us with `all:`:

     import all from 'all:my-part'
     const [implementation] = all
     import x from implementation // error, `from` should be a string

     // so we need to do this
     const x = implementation.default


  Maybe interesting for the discussion:

    - https://humanwhocodes.com/blog/2019/01/stop-using-default-exports-javascript-module/
    - https://blog.neufund.org/why-we-have-banned-default-exports-and-you-should-do-the-same-d51fdc2cf2ad
    - https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
*/