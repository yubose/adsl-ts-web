import { Resolve } from 'noodl-ui';
import App from '../App';
declare const createExtendedDOMResolvers: (app: App) => Resolve.Config<string, HTMLElement>[];
export default createExtendedDOMResolvers;
