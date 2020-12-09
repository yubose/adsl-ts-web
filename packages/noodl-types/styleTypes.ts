export interface StyleObject {
  align?: StyleAlign
  axis?: StyleAxis
  activeColor?: string
  border?: StyleBorderObject
  color?: string
  colorDefault?: string
  colorSelected?: string
  fontSize?: string
  fontFamily?: string
  fontStyle?: 'bold' | string
  height?: string
  isHidden?: boolean
  isHideCondition?: string // ex: "isPatient"
  left?: string
  required?: string
  outline?: string
  textAlign?: StyleTextAlign
  textColor?: string
  top?: string
  width?: string
  shadow?: string // ex: "false"
  [styleKey: string]: any
}

export type StyleAlign = 'centerX' | 'centerY'

export type StyleAxis = 'horizontal' | 'vertical'

export interface StyleBorderObject {
  style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | 1 | 2 | 3 | 4 | 5 | 6 | 7
  width?: string | number
  color?: string | number
  line?: string // ex: "solid"
}

export type StyleTextAlign =
  | 'left'
  | 'center'
  | 'right'
  | StyleAlign
  | StyleTextAlignObject

export interface StyleTextAlignObject {
  x?: 'left' | 'center' | 'right'
  y?: 'left' | 'center' | 'right'
}
