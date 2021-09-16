export interface StyleObject {
	align?: StyleAlign
	axis?: StyleAxis
	activeColor?: string
	background?: string
	backgroundColor?: string
	border?: StyleBorderObject
	borderColor?: string
	borderRadius?: string
	borderWidth?: string
	boxShadow?: string
	boxSizing?: string
	color?: string
	contentSize?: {
		width?: string
		height?: string
	}
	display?: string
	float?: boolean
	flex?: string
	flexFlow?: any
	fontColor?: string
	fontSize?: string
	fontFamily?: string
	fontStyle?: 'bold' | string
	fontWeight?: string
	height?: string
	isHidden?: string | boolean
	justifyContent?: string
	left?: string
	letterSpacing?: string
	lineHeight?: string
	marginLeft?: string
	marginTop?: string
	marginRight?: string
	marginBottom?: string
	minWidth?: string
	maxWidth?: string
	minHeight?: string
	maxHeight?: string
	outline?: string
	padding?: string
	paddingTop?: string
	paddingLeft?: string
	paddingRight?: string
	paddingBottom?: string
	position?: string
	required?: string | boolean
	shadow?: false | string // ex: "false"
	textAlign?: StyleTextAlign
	textColor?: string
	textDecoration?: string
	textIndent?: string
	top?: string
	width?: string
	zIndex?: string | number
	[key: string]: any
}

export type StyleAlign = 'centerX' | 'centerY'

export type StyleAxis = 'horizontal' | 'vertical'

export interface StyleBorderObject {
	style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | 1 | 2 | 3 | 4 | 5 | 6 | 7
	width?: string | number
	color?: string | number
	line?: string // ex: "solid"
	[key: string]: any
}

export type StyleTextAlign =
	| 'left'
	| 'center'
	| 'right'
	| StyleAlign
	| StyleTextAlignObject

export interface StyleTextAlignObject {
	x?: 'left' | 'center' | 'right' | 'centerX'
	y?: 'left' | 'center' | 'right' | 'centerY'
}
