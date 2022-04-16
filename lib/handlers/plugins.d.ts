import * as nt from 'noodl-types';
import App from '../App';
declare const createPlugins: (app: App) => (nt.PluginComponentObject | nt.PluginHeadComponentObject | nt.PluginBodyTailComponentObject)[];
export default createPlugins;
