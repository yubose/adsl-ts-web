/**
 * TODO - Move middlewares to noodl-ui
 *
 * The actionFactory is in its experimental phase and is meant to wrap
 * actions in src/handlers/actions.ts (or src/handlers/builtIns.ts) to
 * provide more functionality in a more dynamic way to capture injected
 * objects from the level 2 sdk (ex: during an onClick)
 */
import { ConsumerOptions, NUIActionGroupedType, NUIActionObject, Store } from 'noodl-ui';
import App from '../App';
export declare type ActionKind = 'action' | 'builtIn';
export declare type ActionHandlerArgs = [destination: string, ...rest: any[]] | [obj: NUIActionObject | {
    pageName: string;
    goto: string;
}, ...rest: any[]] | Parameters<Store.ActionObject['fn']> | Parameters<Store.BuiltInObject['fn']>;
export interface MiddlewareObject {
    id: string;
    fn: MiddlewareFn | null;
}
export interface MiddlewareFn {
    (args: ActionHandlerArgs): Promise<ActionHandlerArgs> | ActionHandlerArgs;
}
export declare type StoreActionObject<T extends Exclude<NUIActionGroupedType, 'anonymous'> | 'builtIn' | 'emit'> = T extends 'builtIn' ? Store.BuiltInObject : Store.ActionObject<T>;
declare const actionFactory: (app: App) => {
    createActionHandler(fn: Store.ActionObject['fn']): (action: import("noodl-ui/dist/actions/EmitAction").default | import("noodl-action-chain/dist/Action").default<"builtIn", string> | import("noodl-action-chain/dist/Action").default<"register", string> | import("noodl-action-chain/dist/Action").default<"evalObject", string> | import("noodl-action-chain/dist/Action").default<"openCamera", string> | import("noodl-action-chain/dist/Action").default<"openPhotoLibrary", string> | import("noodl-action-chain/dist/Action").default<"openDocumentManager", string> | import("noodl-action-chain/dist/Action").default<"pageJump", string> | import("noodl-action-chain/dist/Action").default<"popUp", string> | import("noodl-action-chain/dist/Action").default<"popUpDismiss", string> | import("noodl-action-chain/dist/Action").default<"refresh", string> | import("noodl-action-chain/dist/Action").default<"removeSignature", string> | import("noodl-action-chain/dist/Action").default<"saveObject", string> | import("noodl-action-chain/dist/Action").default<"saveSignature", string> | import("noodl-action-chain/dist/Action").default<"getLocationAddress", string> | import("noodl-action-chain/dist/Action").default<"updateObject", string> | import("noodl-action-chain/dist/Action").default<"anonymous", string> | import("noodl-action-chain/dist/Action").default<"goto", string> | import("noodl-action-chain/dist/Action").default<"toast", string>, options: ConsumerOptions<string>) => Promise<void | any[]>;
    createBuiltInHandler(fn: Store.ActionObject['fn']): (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
    createMiddleware(idProp: string | MiddlewareFn, fnProp?: MiddlewareFn): void;
};
export default actionFactory;
