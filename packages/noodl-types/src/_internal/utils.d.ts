import { NameField, ReferenceString } from '../ecosTypes';
export declare function excludeKeys(keys1: string[], keys2: string | string[]): string[];
export declare function exists(v: unknown): boolean;
export declare function hasKey(key: string, value: any): boolean;
export declare function hasKeyEqualTo(key: string, value: any): boolean;
export declare function hasAllKeys(keys: string | string[]): (value: Record<string, any>) => boolean;
export declare function hasInAllKeys(keys: string | string[]): (value: Record<string, any>) => boolean;
export declare function hasMinimumKeys(keys: string | string[], min: number, value: Record<string, any>): boolean;
export declare function hasNameField<O extends Record<string, any> = Record<string, any>>(v: O | undefined): v is O & {
    name: NameField;
};
export declare function hasAnyKeys(keys: string | string[], value: Record<string, any>): boolean;
export declare function hasInAnyKeys(keys: string | string[], value: Record<string, any>): boolean;
export declare function isArr(v: unknown): v is any[];
export declare function isBool(value: unknown): value is Boolean;
export declare function isNil(v: unknown): boolean;
export declare function isObj(value: unknown): value is Record<string, any>;
export declare function isImg(s: string): boolean;
export declare function isPdf(s: string): boolean;
export declare function isVid(s: string): boolean;
export declare function isYml(s?: string): boolean;
export declare function isJson(s?: string): boolean;
export declare function isJs(s?: string): boolean;
export declare function isNum(v: unknown): v is number;
export declare function isStr(v: unknown): v is string;
export declare const Regex: {
    reference: {
        dot: {
            single: {
                root: RegExp;
                localRoot: RegExp;
            };
            double: {
                root: RegExp;
                localRoot: RegExp;
            };
        };
    };
};
export declare function trimReference<S extends ReferenceString>(v: S): string;
