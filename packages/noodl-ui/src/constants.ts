export const actionTypes = [
  'builtIn',
  'evalObject',
  'goto',
  'pageJump',
  'popUp',
  'popUpDismiss',
  'refresh',
  'saveObject',
  'updateObject',
] as const

export const componentTypes = [
  'button',
  'cell', // deprecated
  'date',
  'dateSelect',
  'divider',
  'footer',
  'header',
  'image',
  'label',
  'list',
  'listItem',
  'plugin',
  'popUp',
  'searchBar',
  'select',
  'scrollView',
  'textField',
  'textView',
  'video',
  'view',
] as const

export const contentTypes = [
  'countryCode',
  'email',
  'formattedDate',
  'formattedDuration',
  'listObject',
  'number',
  'password',
  'passwordHidden',
  'phoneNumber',
  'phone',
  'tel',
  'text',
  'videoSubStream',
  'vidoeSubStream',
] as const

export const eventTypes = [
  'onClick',
  'onHover',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp',
] as const

export const customComponentTypes = [
  'br', // Created customly in components with a textBoard implementation
] as const

export const presets = {
  border: {
    '1': { borderStyle: 'none', borderRadius: '0px' },
    '2': {
      borderRadius: '0px',
      borderStyle: 'none',
      borderBottomStyle: 'solid',
    },
    '3': { borderStyle: 'solid' },
    '4': { borderStyle: 'dashed', borderRadius: '0px' },
    '5': { borderStyle: 'none' },
    '6': { borderStyle: 'solid', borderRadius: '0px' },
    '7': { borderBottomStyle: 'solid', borderRadius: '0px' },
  },
}

/** { textAlign: '' } */
export const textAlignStrings = [
  'left',
  'center',
  'right',
  'centerX',
  'centerY',
]

/** { textAlign: { x, y } } */
export const textAlignXYStrings = ['left', 'center', 'right']
