/** Checks if the value (key of an object) is a reference/entity of another object
 *    ex: A property starting with a dot is a reference to a root object
 * @param { any } value - A value to check if it is a reference
 */

function isReference(value: any) {
  if (typeof value !== 'string') return false
  if (value.startsWith('.')) return true
  if (value.startsWith('=')) return true
  if (value.startsWith('@')) return true
  if (value.endsWith('@')) return true
  return false
}

export default isReference
