import * as t from './types'

export function createAssert(fn: t.AssertFn<any>): t.AssertFn<any> {
  return function (args) {
    const result = fn(args)
    return result
  }
}

export function createAsyncAssert(
  fn: t.AssertAsyncFn<any>,
): t.AssertAsyncFn<any> {
  return async function (args) {
    const result = await fn(args)
    return result
  }
}
