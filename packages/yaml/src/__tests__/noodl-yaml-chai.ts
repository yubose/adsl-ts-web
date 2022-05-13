/// <reference path="../../global.d.ts" />
import Chai from 'chai'
import y from 'yaml'
import { findPair } from 'yaml/util'
import getNodeType from '../utils/getNodeType'
import is from '../utils/is'
import unwrap from '../utils/unwrap'

type YAMLNode = y.Node | y.Document | y.Pair

function NoodlYamlChai(chai: typeof Chai, utils: Chai.ChaiUtils) {
  const Assertion = chai.Assertion
  const expect = chai.expect

  function createAssertNode<N = unknown>(Instance: any) {
    return (node: N) => expect(node).to.be.instanceOf(Instance)
  }

  const assertIs = {
    Scalar: createAssertNode(y.Scalar),
    Pair: createAssertNode(y.Pair),
    YAMLMap: createAssertNode(y.YAMLMap),
    YAMLSeq: createAssertNode(y.YAMLSeq),
    Map: createAssertNode(Map),
    Set: createAssertNode(Set),
  }

  function isYAMLNode(
    node: unknown,
  ): node is y.Node | y.Document | y.Document.Parsed | y.Pair {
    return getNodeType(node) !== 'unknown'
  }

  function noodlProperty<N = y.Node>(
    property: string,
    fn: (this: Chai.AssertionStatic, node: N) => void,
  ) {
    Assertion.addProperty(property, function (this: Chai.AssertionStatic) {
      const node = this._obj as N
      fn.call(this, node)
    })
  }

  function noodlMethod<N = y.Node>(
    method: string,
    fn: (this: Chai.AssertionStatic, node: N, ...args: any[]) => void,
  ) {
    Assertion.addMethod(
      method,
      function (this: Chai.AssertionStatic, ...args: any[]) {
        const node = this._obj as N
        fn.call(this, node, ...args)
      },
    )
  }

  noodlMethod<y.YAMLMap>('path', function (node, path) {
    const actualValue = node.get('path', false)
    assertIs.YAMLMap(node)
    this.assert(
      actualValue === path,
      `expected #{this} to have path #{exp} but received #{act}`,
      `expected #{this} to not have path #{exp}`,
      path,
      actualValue,
    )
  })

  Assertion.overwriteMethod('key', function (_super) {
    return function assertYAMLMapProperty(
      this: Chai.AssertionStatic,
      key: string,
    ) {
      const node = utils.flag(this, 'object') as y.YAMLMap
      if (isYAMLNode(node)) {
        assertIs.YAMLMap(node)
        this.assert(
          node.has(key),
          `expected #{this} to have key #{exp}`,
          `expected #{this} to not have key #{exp}`,
          key,
        )
      } else {
        _super.apply(this, arguments)
      }
    }
  })

  noodlMethod('value', function (node, value) {
    if (y.isMap(node)) {
      this.assert(
        node.items.some((pair) => {
          if (isYAMLNode(pair.value)) return is.equalTo(pair.value, value)
          return unwrap(pair.value) === value
        }),
        `expected #{this} to have value #{exp}`,
        `expected #{this} to not have value #{exp}`,
        value,
      )
    }

    if (y.isPair(node)) {
      this.assert(
        unwrap(node.value) === value,
        `expected Pair #{this} to have value #{exp}`,
        `expected Pair #{this} to not have value #{exp}`,
        value,
      )
    }

    if (y.isScalar(node)) {
      this.assert(
        unwrap(node) === value,
        `expected Scalar #{this} to have value #{exp}`,
        `expected Scalar #{this} to not have value #{exp}`,
        value,
      )
    }

    if (y.isSeq(node)) {
      this.assert(
        unwrap(node.get(value)) === value,
        `expected YAMLSeq #{this} to have value #{exp}`,
        `expected YAMLSeq #{this} to not have value #{exp}`,
        value,
      )
    }
  })

  // Assertion.overwriteChainableMethod('true', function (_super) {
  //   return function assertProperty(
  //     this: Chai.AssertionStatic,
  //     property: string,
  //   ) {
  //     const obj = utils.flag(this, 'object')

  //     if (isYAMLNode(obj)) {
  //       this.assert(
  //         obj.has(property),
  //         `expected #{this} to have a property #{exp} but got #{act}`,
  //         `expected #{this} to not have a property #{exp} but got #{act}`,
  //         property,
  //       )
  //     } else {
  //       _super.apply(this, arguments)
  //     }
  //   }
  // })
}

export default NoodlYamlChai
