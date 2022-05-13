/// <reference types="chai" />
// import type { Scalar } from 'yaml'
import type { YAMLNode } from './src/types'

declare global {
  namespace Chai {
    interface Assertion {
      key(key: string | YAMLNode): Assertion
      path(key: string | YAMLNode): Assertion
      value(value: any): Assertion
    }
  }
}

declare const NoodlYamlChai: Chai.ChaiPlugin
declare namespace NoodlYamlChai {}
export = NoodlYamlChai
