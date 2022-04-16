import * as nt from 'noodl-types';
import { NUIAction, NUIActionObjectInput, NuiComponent, Store } from 'noodl-ui';
import { LiteralUnion } from 'type-fest';
import { ActionMetadata } from '../app/types';
export declare function getActionMetadata<PKey extends string = string>(action: NUIAction | nt.ActionObject | undefined, { component, pickKeys, ...other }?: {
    component?: NuiComponent.Instance | nt.ComponentObject;
    pickKeys?: PKey | PKey[];
} & Partial<Record<string, any>>): ActionMetadata<PKey>;
export declare function getRandomKey(): string;
export declare function isChrome(): boolean;
export declare function isDataUrl(value?: string): boolean;
/**
 * Returns whether the web app is running on a mobile browser.
 * @return { boolean }
 */
export declare function isMobile(): boolean;
export declare function isIOS(): boolean;
export declare function isUnitTestEnv(): boolean;
export declare function isPlainAction(action: NUIAction | NUIActionObjectInput | undefined): action is nt.ActionObject;
declare type ActionObjectArg = Parameters<Store.BuiltInObject['fn']>[0] | Parameters<Store.ActionObject['fn']>[0] | Record<string, any>;
/**
 * Gets the value of the path/property given from the key from either an action
 * instance or action object by accessing action.original[key] or action[key]
 */
export declare function pickActionKey<A extends ActionObjectArg = ActionObjectArg, K extends keyof (nt.ActionObject | nt.UncommonActionObjectProps) = keyof (nt.ActionObject | nt.UncommonActionObjectProps)>(action: A, key: LiteralUnion<K, string>, defaultValue?: any): any;
export declare function pickHasActionKey<A extends ActionObjectArg = ActionObjectArg, K extends keyof (nt.ActionObject | nt.UncommonActionObjectProps) = keyof (nt.ActionObject | nt.UncommonActionObjectProps)>(action: A, key: LiteralUnion<K, string>): boolean;
/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export declare function openOutboundURL(url: string): void;
export declare function logError(err?: any): void;
export declare function throwError(err?: any): void;
export {};
