// const isStr = (v: any): v is string

/**
 * Returns true if the value is a NOODL boolean. A value is a NOODL boolean
 * if the value is truthy, true, "true", false, or "false"
 * @param { any } value
 */
export function isBoolean(value: unknown) {
  return (
    typeof value === 'boolean' || isBooleanTrue(value) || isBooleanFalse(value)
  )
}

/**
 * Returns true if the value is a NOODL true type. A NOODL true type is any
 * value that is the boolean true or the string "true"
 * @param { any } value
 */
export function isBooleanTrue(value: unknown): value is true | 'true' {
  return value === true || value === 'true'
}

/**
 * Returns true if the value is a NOODL false type. A NOODL false type is any
 * value that is the boolean false or the string "false"
 * @param { any } value
 */
export function isBooleanFalse(value: unknown): value is false | 'false' {
  return value === false || value === 'false'
}

/**
 * Returns true if value has a viewTag of "selfStream", false otherwise
 * @param { any } value
 */
// export function isSelfStreamComponent(value: any) {
//   const fn = (val: string) => .isString(val) && /selfStream/i.test(val)
//   return checkForNoodlProp(value, 'viewTag', fn)
// }
