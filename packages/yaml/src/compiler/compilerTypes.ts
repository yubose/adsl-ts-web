import * as c from '../constants'
import type DocRoot from '../DocRoot'

export namespace Processor {
  export type InstructionType = BaseInstructionType | OrganicInstructionType

  export type BaseInstructionType =
    | 'collect'
    | 'else'
    | 'evaluate'
    | 'extend'
    | 'goto'
    | 'if'
    | 'inherit'
    | 'override'

  export type OrganicInstructionType = 'convolve' | 'elite' | 'emit' | 'evolve'

  export interface Instruction {
    type: InstructionType
    value: any
  }

  export interface Options<N = unknown> {
    instructions: Instruction[]
    node: N
    root: DocRoot
    rootKey?: string
  }
}
