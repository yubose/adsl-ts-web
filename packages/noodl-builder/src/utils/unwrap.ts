import NoodlBase from '../Base'
import NoodlProperty from '../Property'
import NoodlString from '../String'

function unwrap<O extends NoodlBase>(value: O) {
  if (NoodlProperty.is(value) || NoodlString.is(value)) {
    return value.getValue()
  }
  return String(value)
}

export default unwrap
