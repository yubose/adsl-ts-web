/// <reference lib="WebWorker" />
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js')
importScripts('https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js')
import type { ValueOf, LiteralUnion } from 'type-fest'
import type IDB from 'idb'
import type _JSBI from 'jsbi/jsbi'
import * as u from '@jsmanifest/utils'
import { FuzzyWorker, FuzzyIndexCreator } from 'noodl-pi'

// @ts-expect-error
let _self = self as DedicatedWorkerGlobalScope
let _cptStore: IDB.IDBPObjectStore
let _cptStoreMod: IDB.IDBPObjectStore

let indexCreator = new FuzzyIndexCreator()

const sendMessage = _self.postMessage
const isArr = <O = any>(value: any): value is O[] => Array.isArray(value)
const isObj = (value) =>
  value != null && !isArr(value) && typeof value === 'object'
// prettier-ignore
const partialRight = (fn: (...args: any[]) => any, ...args1: any[]) => (...args2: any[]) => fn(...args1, ...args2)
// prettier-ignore
const partialByKey = <T1 extends Record<string, any>, T2 extends keyof T1 = keyof T1, T3 = any>(key: LiteralUnion<T2, string>) => (obj: T1, ...args: T3[]) => obj[key]?.(...args)
const partialMsg = (msg1: any) => (msg2: any) =>
  sendMessage({ ...msg1, ...msg2 })
const requestStoreData = partialMsg({ type: c.REQUEST_STORE_DATA })
const toArray = <O = any>(o: O) =>
  (isArr(o) ? o : [o]) as O extends any[] ? O : O[]
const saveStoreData = partialByKey<IDB.IDBPDatabase>('put')
const getFromStore = partialByKey<IDB.IDBPDatabase>('get')
const deleteFromStore = partialByKey<IDB.IDBPDatabase>('delete')
const createStore = partialByKey<IDB.IDBPDatabase>('createObjectStore')
