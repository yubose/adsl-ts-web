import { Page as NUIPage, NDOMPage } from 'noodl-ui';
import App from '../App';
declare function createPickNDOMPage(app: App): (page: NUIPage | NDOMPage | undefined) => NDOMPage;
export default createPickNDOMPage;
