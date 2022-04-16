import { MiddlewareFn } from '../../factories/actionFactory';
import App from '../../App';
/**
 * This file contains middleware functions wrapping functions from
 * src/actions.ts and src/builtIns.ts
 */
declare const registerMiddleware: (app: App) => {
    handleInjections: MiddlewareFn;
};
export default registerMiddleware;
