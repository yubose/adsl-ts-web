import * as T from 'noodl-types'

export const actionTypes = [
  'anonymous', // lib
  'builtIn',
  'emit', // lib
  'evalObject',
  'goto', // lib
  'pageJump',
  'popUp',
  'popUpDismiss',
  'refresh',
  'saveObject',
  'updateObject',
] as const

export const componentTypes: T.ComponentType[] = [
  'button',
  'chart',
  'date' as any,
  'divider',
  'footer',
  'header',
  'image',
  'label',
  'list',
  'listItem',
  'plugin',
  'pluginHead',
  'popUp',
  'register',
  'select',
  'scrollView',
  'textField',
  'textView',
  'video',
  'view',
]

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
  'onBlur',
  'onClick',
  'onChange',
  'onHover',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseOut',
  'onMouseOver',
] as const
