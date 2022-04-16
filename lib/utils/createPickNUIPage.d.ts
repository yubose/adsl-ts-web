import { Page as NUIPage, NDOMPage } from 'noodl-ui';
import App from '../App';
declare function createPickNUIPage(app: App): (page: NUIPage | NDOMPage | undefined) => NUIPage;
export default createPickNUIPage;
