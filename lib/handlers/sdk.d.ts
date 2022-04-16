import App from '../App';
export declare function getSdkHelpers(app: App): {
    initPageBuiltIns: {
        EcosObj: {
            readonly download: (this: App, { ecosObj }?: {
                ecosObj?: import("noodl-types").EcosDocument<any, import("noodl-types").MediaType>;
            }) => void;
            readonly exportCSV: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
            readonly exportPDF: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        };
        readonly downloadQRCode: (this: App, { content, scale, viewTag, }?: {
            content?: any;
            scale?: number;
            viewTag?: string;
        }) => void;
        FCMOnTokenReceive(params?: any): Promise<any[]>;
        readonly FCMOnTokenRefresh: any;
        readonly checkField: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        readonly goto: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        readonly hide: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        readonly show: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        readonly redraw: (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        readonly videoChat: any;
    };
};
