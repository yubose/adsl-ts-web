/**
 * A utility that wraps document.createElement. Created mainly to benefit from
 * typescript casting
 * @param { string } tagName - HTML tag name
 */
function createElement<K extends keyof HTMLElementTagNameMap>(tag: K) {
  return document.createElement(tag)
}

export default createElement
