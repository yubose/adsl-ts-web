import { ActionObject } from './actionTypes'
import { StyleObject } from './styleTypes'

export type ActionChain = (
	| ActionObject
	| EmitObjectFold
	| GotoObject
	| IfObject
)[]

export interface EmitObject {
	actions: any[]
	dataKey?: string | { [key: string]: string }
	[key: string]: any
}

export interface EmitObjectFold {
	emit: EmitObject
	[key: string]: any
}

export type GotoUrl = string

export interface GotoObject<V = string> {
	goto: V
	[key: string]: any
}

export interface IfObject<Cond = any, VT = any, VF = any> {
	if: [Cond, VT, VF]
	[key: string]: any
}

export type Path<V = any> = V extends string
	? string
	: V extends EmitObjectFold
	? EmitObjectFold
	: V extends IfObject
	? IfObject
	: string | EmitObjectFold | IfObject

export type TextBoardObject = (
	| { color?: string; text?: string }
	| { br?: null | '' }
)[]

export interface ToastObject {
	message?: string
	style?: StyleObject
}

export namespace Url {
	export type PageComponent<
		TargetPage extends string = string,
		CurrentPage extends string = string,
		ViewTag extends string = string,
	> = TargetPage | `${TargetPage}@${CurrentPage}#${ViewTag}`
}
