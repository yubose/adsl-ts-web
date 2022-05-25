import * as c from '../constants'
import type DocRoot from '../DocRoot'
import {
  BasicInstructionType,
  OrganicInstructionType,
} from './compilerConstants'

export namespace Processor {
  export interface Instruction {
    type: BasicInstructionType | OrganicInstructionType
    value: any
  }

  export interface Options<N = unknown> {
    instructions: Instruction[]
    node: N
    root: DocRoot
    rootKey?: string
  }
}
