export interface ConfigValidatorOptions {
    configKey: string;
    timestampKey: string;
    get?: (key: string) => Promise<any>;
    set?: (key: string, value: any) => Promise<void>;
}
declare function createNoodlConfigValidator({ configKey, timestampKey, get, set, }: ConfigValidatorOptions): {
    cacheTimestamp: () => Promise<void>;
    configExists: () => Promise<boolean>;
    getCurrentTimestamp: () => Promise<any>;
    getStoredTimestamp: () => Promise<any>;
    getStoredConfigObject: () => Promise<any>;
    getTimestampKey: () => Promise<string>;
    isTimestampEq: () => Promise<boolean>;
};
export default createNoodlConfigValidator;
