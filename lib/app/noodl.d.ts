/**
 * SOON TO BE DEPRECATED: resetInstance
 * Environment/config key will be passed in using CLI
 *
 * @example
 *
 * ```shell
 * npm run build:deploy:test -- --env CONFIG=admind3 ENV=stable
 * ```
 */
import { CADL as NOODL } from '@aitmed/cadl';
import type { Env } from 'noodl-types';
/**
 * @deprecated
 */
export declare const BASE = "https://public.aitmed.com/config";
/**
 * @deprecated
 */
export declare const CONFIG_KEY = "provider";
/**
 * @deprecated
 */
export declare const LOCAL_SERVER: string;
/**
 * @deprecated
 */
export declare const SAFE_DEPLOY_URL: string;
/**
 * @deprecated
 */
export declare function getConfigEndpoint(name: string): string;
export declare const CONFIG_URL: string;
export declare let noodl: NOODL | undefined;
/**
 * @deprecated
 */
export declare function resetInstance(): NOODL;
/**
 * Returns the instance of level 3 sdk. If overwrite is true it will not reuse the previous but and instead create a new one.
 * @param { ConstructorParameters<typeof NOODL>[0] } [options]
 * @param { boolean } [overwrite]
 */
export declare function createInstance(options?: Partial<ConstructorParameters<typeof NOODL>[0]> & {
    env?: Env;
    overwrite?: boolean;
}): NOODL;
declare const _default: NOODL;
export default _default;
