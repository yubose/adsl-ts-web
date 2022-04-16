/**
 * PLAN TO BE USED AS THE ONE MAIN GOTO FUNCTION
 */
import type { ConsumerOptions, NUIAction, Store } from 'noodl-ui';
import App from '../../App';
export declare function useGotoSpinner(app: App, fn: (action: NUIAction, options: ConsumerOptions) => Promise<void>): (action: NUIAction, options: ConsumerOptions) => Promise<void>;
declare function createGoto(app: App): (action: Store.ActionObject['fn'] | Store.BuiltInObject['fn'], opts: ConsumerOptions) => Promise<void>;
export default createGoto;
