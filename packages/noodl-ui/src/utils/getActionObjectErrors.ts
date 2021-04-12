import { Identify } from 'noodl-types'
import { NUIActionObjectInput } from '../types'

function getActionObjectErrors(obj: NUIActionObjectInput | undefined) {
  const results = [] as string[]

  if (Identify.emit(obj)) {
    //
  } else if (Identify.goto(obj)) {
    //
  } else if (Identify.toast(obj)) {
    //
  } else if (Identify.action.any(obj)) {
    if (Identify.action.builtIn(obj)) {
      //
    } else if (Identify.action.evalObject(obj)) {
      if ('object' in obj) {
        if (Identify.reference(obj.object)) {
          results.push(
            `Received a string reference "${obj.object}" as the "object" for action "evalObject"`,
          )
        } else if (obj.object !== null && typeof obj.object === 'object') {
          for (const [key, val] of Object.entries(obj.object)) {
            if (Identify.reference(key)) {
              results.push(
                `Received a string reference key "${key}" inside evalObject`,
              )
            }
            if (Identify.reference(val)) {
              results.push(
                `Received a string reference value "${key}" inside evalObject`,
              )
            }
          }
        }
      }
    } else if (Identify.action.pageJump(obj)) {
      //
    } else if (Identify.action.popUp(obj)) {
      //
    } else if (Identify.action.popUpDismiss(obj)) {
      //
    } else if (Identify.action.refresh(obj)) {
      //
    } else if (Identify.action.saveObject(obj)) {
      //
    } else if (Identify.action.updateObject(obj)) {
      //
    } else {
      results.push(
        // prettier-ignore
        `Could not identify an input as an action: ${JSON.stringify(obj,null,2)}`,
      )
    }
  }

  return results
}

export default getActionObjectErrors
