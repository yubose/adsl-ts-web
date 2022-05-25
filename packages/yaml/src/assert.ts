import * as t from './types'

export function createAssert<N = unknown>(fn: t.AssertFn<N>): t.AssertFn<N> {
  return function (args) {
    const result = fn(args)
    return result
  }
}

export function createAsyncAssert<N = unknown>(
  fn: t.AssertAsyncFn<N>,
): t.AssertAsyncFn<N> {
  return async function (args) {
    const result = await fn(args)
    return result
  }
}
