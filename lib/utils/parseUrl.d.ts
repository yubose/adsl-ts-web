import * as nt from 'noodl-types';
/**
 * Parses the URL to determine the start url and start page.
 * Useful when users are coming from an outside link
 * (ex: being redirected after submitting a payment)
 *
 * In order of precedence:
    1. Determine the initial action by URL
    2. Determine the initial action by page in cache
    3. Determine the initial action by start page
 *
 * @param appConfig cadlEndpoint object
 * @param value url string
 */
declare function parseUrl(appConfig: nt.AppConfig, value?: string): {
    base: string;
    hasParams: boolean;
    hostname: string;
    noodlPathname: string;
    pages: string[];
    pageUrl: string;
    params: {};
    startPage: string;
    url: string;
    currentPage: string;
    paramsStr: string;
};
export default parseUrl;
