import { LiteralUnion } from 'type-fest'
import { OrArray } from './_internal/types'
import { EmitObjectFold, GotoObject, IfObject } from './uncategorizedTypes'
import { BuiltInEvalObject, DataIn, ReferenceString } from './ecosTypes'

export interface UncommonActionObjectProps {
	actions?: any[]
	contentType?: string // ex: "messageHidden"
	emit?: EmitObjectFold
	dataKey?: any
	dataIn?: any
	dataObject?: any
	destination?: string
	dismissOnTouchOutside?: boolean
	evolve?: boolean
	funcName?: string
	message?: string
	object?: any
	pageReload?: boolean
	popUpView?: string
	reload?: boolean
	timer?: number
	viewTag?: string
	wait?: boolean | number
}

export interface ActionObject<T extends string = string> {
	actionType: T
	[key: string]: any
}

export interface BuiltInActionObject
	extends ActionObject,
		Pick<
			UncommonActionObjectProps,
			'contentType' | 'dataKey' | 'evolve' | 'funcName' | 'reload' | 'viewTag'
		> {
	actionType: 'builtIn'
	[key: string]: any
}

export interface EvalActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
	actionType: 'evalObject'
	object?: OrArray<
		| IfObject
		| BuiltInEvalObject
		| BuiltInActionObject
		| GotoObject<string | { dataIn?: DataIn }>
		| ''
		| Record<
				ReferenceString,
				| null
				| boolean
				| BuiltInEvalObject
				| LiteralUnion<ReferenceString, string>
				| number
				| string
				| Record<ReferenceString, ReferenceString>
		  >
	>
	[key: string]: any
}

export interface OpenCameraActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
	actionType: 'openCamera'
	[key: string]: any
}

export interface OpenPhotoLibraryActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
	actionType: 'openPhotoLibrary'
	[key: string]: any
}

export interface OpenDocumentManagerActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
	actionType: 'openDocumentManager'
	[key: string]: any
}

export interface PageJumpActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'destination'> {
	actionType: 'pageJump'
	[key: string]: any
}

export interface PopupActionObject
	extends ActionObject,
		Pick<
			UncommonActionObjectProps,
			'dismissOnTouchOutside' | 'popUpView' | 'wait'
		> {
	actionType: 'popUp'
	[key: string]: any
}

export interface PopupDismissActionObject
	extends ActionObject,
		Pick<
			UncommonActionObjectProps,
			'dismissOnTouchOutside' | 'popUpView' | 'wait'
		> {
	actionType: 'popUpDismiss'
	[key: string]: any
}

export interface RefreshActionObject extends ActionObject {
	actionType: 'refresh'
	[key: string]: any
}

export interface RemoveSignatureActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {
	actionType: 'removeSignature'
	[key: string]: any
}

export interface SaveActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'object'> {
	actionType: 'saveObject'
	[key: string]: any
}

export interface SaveSignatureActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {
	actionType: 'saveSignature'
	[key: string]: any
}

export interface UpdateActionObject
	extends ActionObject,
		Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {}
