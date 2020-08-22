// @ts-nocheck
import _ from 'lodash'
import { NOODLComponent, NOODLComponentType } from 'noodl-ui'

export type RendererType = string | RendererFunc | HTMLElement

export interface RendererFunc {
  (...args: any[]): string | number | HTMLElement | null
}

export interface RendererObject {
  type: NOODLComponentType
  element: HTMLElement | null
  predicate?(component: NOODLComponent): boolean
}

/**
 * NOTE: This class is moving to the noodl-ui library
 */

class Renderer {
  private _dependencies: { [dependency: string]: RendererFunc } = {}
  public root: HTMLElement | null = null

  public register(type: NOODLComponentType, renderer: RendererFunc) {
    if (_.isString(renderer)) {
      if (_.isNil(this._dependencies[renderer])) {
        //
      }
    }
  }

  public get(component: NOODLComponent) {}
}

export default Renderer
