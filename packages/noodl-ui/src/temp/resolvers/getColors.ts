import { ComponentObject } from 'noodl-types'

export function formatColor(value: string) {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value.replace('0x', '#')
  }
  return value || ''
}

/**
 * Returns a new object with some keywords changed to align more with html/css/etc
 * Also converts color values like 0x00000000 to #00000000
 * @param { Component } component
 */
export default {
  name: 'getColors',
  resolve({ component }: { component: ComponentObject }) {
    if (!component) return
    if (component?.style) {
      Object.entries(component.style || {}).forEach(([key, value]) => {
        if (typeof value === 'string') {
          if ((value as string).startsWith('0x')) {
            // Rename textColor to color
            if (key === 'textColor') {
              // TODO: This shouldn't be disabled but enabling this makes some text white which
              //    becomes invisible on the page. Find out the solution to getting this right
              // result['textColor'] = value.replace('0x', '#')
              component?.style && (component.style.color = formatColor(value))
              delete component.style?.textColor
            } else {
              // Convert other keys if they aren't formatted as well just in case
              // textColor for "color" attr is handled above
              component.style &&
                (component.style[key as any] = formatColor(value))
            }
          }
        }
      })
    }
  },
}
