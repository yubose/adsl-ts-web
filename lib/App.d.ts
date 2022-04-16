import type { CADL } from '@aitmed/cadl';
import * as nu from 'noodl-utils';
import { PageObject } from 'noodl-types';
import { NDOM, NDOMPage, NUIActionObject, NUITrigger, Page as NUIPage, Viewport as VP } from 'noodl-ui';
import { AuthStatus } from './app/types';
import AppNotification from './app/Notifications';
import createGoto from './handlers/shared/goto';
import Spinner from './spinner';
import * as t from './app/types';
declare class App {
    #private;
    actionFactory: {
        createActionHandler(fn: (action: import("noodl-ui/dist/actions/EmitAction").default | import("noodl-action-chain/dist/Action").default<"builtIn", string> | import("noodl-action-chain/dist/Action").default<"register", string> | import("noodl-action-chain/dist/Action").default<"evalObject", string> | import("noodl-action-chain/dist/Action").default<"openCamera", string> | import("noodl-action-chain/dist/Action").default<"openPhotoLibrary", string> | import("noodl-action-chain/dist/Action").default<"openDocumentManager", string> | import("noodl-action-chain/dist/Action").default<"pageJump", string> | import("noodl-action-chain/dist/Action").default<"popUp", string> | import("noodl-action-chain/dist/Action").default<"popUpDismiss", string> | import("noodl-action-chain/dist/Action").default<"refresh", string> | import("noodl-action-chain/dist/Action").default<"removeSignature", string> | import("noodl-action-chain/dist/Action").default<"saveObject", string> | import("noodl-action-chain/dist/Action").default<"saveSignature", string> | import("noodl-action-chain/dist/Action").default<"getLocationAddress", string> | import("noodl-action-chain/dist/Action").default<"updateObject", string> | import("noodl-action-chain/dist/Action").default<"anonymous", string> | import("noodl-action-chain/dist/Action").default<"goto", string> | import("noodl-action-chain/dist/Action").default<"toast", string>, options: import("noodl-ui").ConsumerOptions<string>) => Promise<void | any[]>): (action: import("noodl-ui/dist/actions/EmitAction").default | import("noodl-action-chain/dist/Action").default<"builtIn", string> | import("noodl-action-chain/dist/Action").default<"register", string> | import("noodl-action-chain/dist/Action").default<"evalObject", string> | import("noodl-action-chain/dist/Action").default<"openCamera", string> | import("noodl-action-chain/dist/Action").default<"openPhotoLibrary", string> | import("noodl-action-chain/dist/Action").default<"openDocumentManager", string> | import("noodl-action-chain/dist/Action").default<"pageJump", string> | import("noodl-action-chain/dist/Action").default<"popUp", string> | import("noodl-action-chain/dist/Action").default<"popUpDismiss", string> | import("noodl-action-chain/dist/Action").default<"refresh", string> | import("noodl-action-chain/dist/Action").default<"removeSignature", string> | import("noodl-action-chain/dist/Action").default<"saveObject", string> | import("noodl-action-chain/dist/Action").default<"saveSignature", string> | import("noodl-action-chain/dist/Action").default<"getLocationAddress", string> | import("noodl-action-chain/dist/Action").default<"updateObject", string> | import("noodl-action-chain/dist/Action").default<"anonymous", string> | import("noodl-action-chain/dist/Action").default<"goto", string> | import("noodl-action-chain/dist/Action").default<"toast", string>, options: import("noodl-ui").ConsumerOptions<string>) => Promise<void | any[]>;
        createBuiltInHandler(fn: (action: import("noodl-ui/dist/actions/EmitAction").default | import("noodl-action-chain/dist/Action").default<"builtIn", string> | import("noodl-action-chain/dist/Action").default<"register", string> | import("noodl-action-chain/dist/Action").default<"evalObject", string> | import("noodl-action-chain/dist/Action").default<"openCamera", string> | import("noodl-action-chain/dist/Action").default<"openPhotoLibrary", string> | import("noodl-action-chain/dist/Action").default<"openDocumentManager", string> | import("noodl-action-chain/dist/Action").default<"pageJump", string> | import("noodl-action-chain/dist/Action").default<"popUp", string> | import("noodl-action-chain/dist/Action").default<"popUpDismiss", string> | import("noodl-action-chain/dist/Action").default<"refresh", string> | import("noodl-action-chain/dist/Action").default<"removeSignature", string> | import("noodl-action-chain/dist/Action").default<"saveObject", string> | import("noodl-action-chain/dist/Action").default<"saveSignature", string> | import("noodl-action-chain/dist/Action").default<"getLocationAddress", string> | import("noodl-action-chain/dist/Action").default<"updateObject", string> | import("noodl-action-chain/dist/Action").default<"anonymous", string> | import("noodl-action-chain/dist/Action").default<"goto", string> | import("noodl-action-chain/dist/Action").default<"toast", string>, options: import("noodl-ui").ConsumerOptions<string>) => Promise<void | any[]>): (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>;
        createMiddleware(idProp: string | import("./factories/actionFactory").MiddlewareFn, fnProp?: import("./factories/actionFactory").MiddlewareFn): void;
    };
    goto: ReturnType<typeof createGoto>;
    obs: t.AppObservers;
    getStatus: t.AppConstructorOptions['getStatus'];
    mainPage: NDOM['page'];
    pickNUIPage: (page: NUIPage | NDOMPage) => NUIPage;
    pickNDOMPage: (page: NUIPage | NDOMPage) => NDOMPage;
    static id: string;
    constructor({ getStatus, meeting, noodl, notification, nui, ndom, viewport, }?: t.AppConstructorOptions);
    get aspectRatio(): number;
    set aspectRatio(aspectRatio: number);
    get authStatus(): "" | AuthStatus;
    get actions(): import("noodl-ui/dist/cache/ActionsCache").default<string> & Record<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", import("noodl-ui").Store.ActionObject<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", string>[]> & {
        builtIn: Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
        emit: Map<import("type-fest").LiteralUnion<NUITrigger, string>, import("noodl-ui").Store.ActionObject<import("noodl-ui").NUIActionType, string>[]>;
        register: Record<string, import("noodl-ui").Register.Object<string>[]>;
    };
    get builtIns(): Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
    get config(): import("noodl-types").RootConfig;
    get cache(): {
        actions: import("noodl-ui/dist/cache/ActionsCache").default<string> & Record<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", import("noodl-ui").Store.ActionObject<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", string>[]> & {
            builtIn: Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
            emit: Map<import("type-fest").LiteralUnion<NUITrigger, string>, import("noodl-ui").Store.ActionObject<import("noodl-ui").NUIActionType, string>[]>;
            register: Record<string, import("noodl-ui").Register.Object<string>[]>;
        };
        component: import("noodl-ui/dist/cache/ComponentCache").default;
        page: import("noodl-ui/dist/cache/PageCache").default;
        plugin: import("noodl-ui/dist/cache/PluginCache").default;
        register: import("noodl-ui/dist/cache/RegisterCache").default;
        transactions: import("noodl-ui/dist/cache/TransactionsCache").default;
    };
    get instances(): {
        FullCalendar: {
            inst: any;
            page: string;
        };
    };
    get spinner(): Spinner;
    get pendingPage(): string;
    get currentPage(): string;
    get previousPage(): any;
    get globalRegister(): (import("noodl-types").RegisterComponentObject & Record<string, any>)[];
    get loadingPages(): Record<string, {
        id: string;
        init: boolean;
    }[]>;
    get initialized(): boolean;
    get meeting(): {
        calledOnConnected: boolean;
        readonly isConnected: boolean;
        readonly localParticipant: import("twilio-video").LocalParticipant;
        room: import("twilio-video").Room & {
            _isMock?: boolean;
        };
        readonly mainStream: import("./meeting/Stream").default;
        readonly selfStream: import("./meeting/Stream").default;
        readonly subStreams: import("./meeting/Substreams").default;
        readonly streams: import("./meeting/Streams").default;
        join(token: string): Promise<import("twilio-video").Room & {
            _isMock?: boolean;
        }>;
        rejoin(): Promise<import("twilio-video").Room & {
            _isMock?: boolean;
        }>;
        hideWaitingOthersMessage(): void;
        showWaitingOthersMessage(): void;
        leave(): any;
        addRemoteParticipant(participant: t.RoomParticipant, { force, }?: {
            force?: boolean;
        }): Promise<any>;
        removeRemoteParticipant(participant: t.RoomParticipant, { force }?: {
            force?: boolean;
        }): any;
        isLocalParticipant(participant: t.RoomParticipant): participant is import("twilio-video").LocalParticipant;
        getMainStreamElement(): HTMLDivElement;
        getSelfStreamElement(): HTMLDivElement;
        getSubStreamElement(): HTMLDivElement | HTMLDivElement[];
        getCameraElement(): HTMLImageElement;
        getMicrophoneElement(): HTMLImageElement;
        getHangUpElement(): HTMLImageElement;
        getInviteOthersElement(): HTMLImageElement;
        getParticipantsListElement(): HTMLUListElement;
        getVideoChatElements(): {
            mainStream: HTMLDivElement;
            selfStream: HTMLDivElement;
            subStream: HTMLDivElement | HTMLDivElement[];
            camera: HTMLImageElement;
            microphone: HTMLImageElement;
            hangUp: HTMLImageElement;
            inviteOthers: HTMLImageElement;
            videoSubStream: HTMLUListElement;
        };
        getWaitingMessageElements(): HTMLElement[];
        reset(key?: "room" | "streams"): any;
        removeFalseParticipants(participants: any[]): any[];
        swapParticipantStream(stream1: import("./meeting/Stream").default, stream2: import("./meeting/Stream").default, participant1: t.RoomParticipant, participant2: t.RoomParticipant): void;
    } & {
        onConnected(room: import("twilio-video").Room): any;
        onAddRemoteParticipant(participant: import("twilio-video").RemoteParticipant, stream: import("./meeting/Stream").default): any;
        onRemoveRemoteParticipant(participant: import("twilio-video").RemoteParticipant, stream: import("./meeting/Stream").default): any;
    };
    get noodl(): CADL;
    get nui(): {
        _experimental: {
            readonly register: {
                (name: string, fn: ((obj: import("noodl-ui").Register.Object<string>, params: import("noodl-ui").Register.Params<any>) => Promise<any>) | Partial<import("noodl-ui").Register.Object<string>>, options?: Partial<import("noodl-ui").Register.Object<string>>): import("noodl-ui").Register.Object<string>;
                (registerComponent: import("noodl-types").RegisterComponentObject, options?: ((obj: import("noodl-ui").Register.Object<string>, params: import("noodl-ui").Register.Params<any>) => Promise<any>) | Partial<import("noodl-ui").Register.Object<string>>): import("noodl-ui").Register.Object<string>;
            };
        };
        _defineGetter(key: string, opts: PropertyDescriptor | ((...args: any[]) => any)): void;
        readonly cache: {
            actions: import("noodl-ui/dist/cache/ActionsCache").default<string> & Record<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", import("noodl-ui").Store.ActionObject<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", string>[]> & {
                builtIn: Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
                emit: Map<import("type-fest").LiteralUnion<NUITrigger, string>, import("noodl-ui").Store.ActionObject<import("noodl-ui").NUIActionType, string>[]>;
                register: Record<string, import("noodl-ui").Register.Object<string>[]>;
            };
            component: import("noodl-ui/dist/cache/ComponentCache").default;
            page: import("noodl-ui/dist/cache/PageCache").default;
            plugin: import("noodl-ui/dist/cache/PluginCache").default;
            register: import("noodl-ui/dist/cache/RegisterCache").default;
            transactions: import("noodl-ui/dist/cache/TransactionsCache").default;
        };
        readonly clean: (page: NUIPage, onClean?: (stats?: {
            componentsRemoved: number;
        }) => void) => void;
        readonly createGetter: (page?: NUIPage) => (key?: string, { dataObject, iteratorVar, page: priorityPage, pageObject, }?: {
            dataObject?: any;
            iteratorVar?: string;
            page?: NUIPage;
            pageObject?: PageObject;
        }) => any;
        readonly createGoto: (fn: import("noodl-ui").GotoFn) => (args: string | import("noodl-types").GotoObject<string>) => any[];
        readonly createComponent: (componentObject: import("noodl-ui").NuiComponent.Instance | import("noodl-types").ComponentObject<any> | import("noodl-ui").NuiComponentType, page: NUIPage) => import("noodl-ui").NuiComponent.Instance;
        createPage(args?: string | import("noodl-ui").NuiComponent.Instance | NUIPage | {
            name?: string;
            component?: import("noodl-ui").NuiComponent.Instance;
            id?: string;
            onChange?: {
                id?: string;
                fn: (prev: string, next: string) => void;
            };
            viewport?: VP | {
                width?: number;
                height?: number;
            };
        }): NUIPage;
        createPlugin(location?: import("noodl-ui").NuiComponent.Instance | import("noodl-ui").Plugin.Location | import("noodl-ui").Plugin.ComponentObject, obj?: import("noodl-ui").NuiComponent.Instance | import("noodl-ui").Plugin.ComponentObject): import("noodl-ui").Plugin.Object;
        createActionChain(trigger: NUITrigger, actions: import("@jsmanifest/typefest").OrArray<import("noodl-ui").NUIActionObjectInput>, opts?: import("noodl-action-chain").ActionChainObserver<import("noodl-types").ActionObject<string>> & {
            component?: import("noodl-ui").NuiComponent.Instance;
            context?: Record<string, any>;
            on?: import("noodl-ui").On;
            loadQueue?: boolean;
            id?: string;
            page?: NUIPage;
        }, id?: string): import("noodl-ui").NUIActionChain;
        readonly createSrc: {
            (args: {
                key: string;
                value: string | import("noodl-types").EmitObjectFold<Record<string, any>> | import("noodl-types").IfObject<any, any, any> | import("noodl-types").IfObject<any, any, any>;
                component: import("noodl-ui").NuiComponent.Instance;
                page: NUIPage;
            }): Promise<string>;
            (path: string | import("noodl-types").EmitObjectFold<Record<string, any>> | import("noodl-types").IfObject<any, any, any> | import("noodl-types").IfObject<any, any, any>, opts?: {
                component: import("noodl-ui").NuiComponent.Instance;
                context?: Record<string, any>;
            }): Promise<string>;
            (path: import("noodl-types").IfObject<any, any, any>, opts?: {
                component?: import("noodl-ui").NuiComponent.Instance;
                page?: NUIPage;
            }): Promise<string>;
            (path: string): Promise<string>;
        };
        readonly emit: {
            <Evt extends string = string>(opts?: import("noodl-ui").NUIEmit.EmitRegister<Evt>): Promise<any[]>;
            <Tid extends import("noodl-ui").TransactionId = import("noodl-ui").TransactionId>(obj?: import("noodl-ui").NUIEmit.EmitTransaction<Tid>): Promise<Parameters<import("noodl-ui").Transaction[Tid]["callback"]>[0]>;
        };
        getAssetsUrl: () => string;
        getActions: {
            (): import("noodl-ui/dist/cache/ActionsCache").default<string>;
            (actionType: "emit"): Map<NUITrigger, import("noodl-ui").Store.ActionObject<"emit", string>[]>;
            (actionType: "builtIn"): Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
            <AType extends "evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast">(actionType: AType): import("noodl-ui").Store.ActionObject<AType, string>[];
        };
        getBuiltIns: () => Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
        getBaseUrl: () => string;
        getBaseStyles(component: Record<string, any> | import("noodl-ui").NuiComponent.Instance, originalComponent?: Record<string, any> | import("noodl-ui").NuiComponent.Instance): any;
        getConsumerOptions({ callback, component, on, page, context, ...rest }: {
            callback?(component: import("noodl-ui").NuiComponent.Instance): import("noodl-ui").NuiComponent.Instance;
            component?: import("noodl-ui").NuiComponent.Instance;
            on?: import("noodl-ui").On;
            page: NUIPage;
            context?: Record<string, any>;
        } & {
            [key: string]: any;
        }): {
            callback: (component: import("noodl-ui").NuiComponent.Instance) => import("noodl-ui").NuiComponent.Instance;
            cache: {
                actions: import("noodl-ui/dist/cache/ActionsCache").default<string> & Record<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", import("noodl-ui").Store.ActionObject<"evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast", string>[]> & {
                    builtIn: Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
                    emit: Map<import("type-fest").LiteralUnion<NUITrigger, string>, import("noodl-ui").Store.ActionObject<import("noodl-ui").NUIActionType, string>[]>;
                    register: Record<string, import("noodl-ui").Register.Object<string>[]>;
                };
                component: import("noodl-ui/dist/cache/ComponentCache").default;
                page: import("noodl-ui/dist/cache/PageCache").default;
                plugin: import("noodl-ui/dist/cache/PluginCache").default;
                register: import("noodl-ui/dist/cache/RegisterCache").default;
                transactions: import("noodl-ui/dist/cache/TransactionsCache").default;
            };
            component: import("noodl-ui").NuiComponent.Instance;
            context: Record<string, any>;
            createPage: (args?: string | import("noodl-ui").NuiComponent.Instance | NUIPage | {
                name?: string;
                component?: import("noodl-ui").NuiComponent.Instance;
                id?: string;
                onChange?: {
                    id?: string;
                    fn: (prev: string, next: string) => void;
                };
                viewport?: VP | {
                    width?: number;
                    height?: number;
                };
            }) => NUIPage;
            createActionChain<C extends import("noodl-ui").NuiComponent.CreateType, Context = any>(trigger: NUITrigger, actions: NUIActionObject | NUIActionObject[], { context: contextProp, loadQueue, }?: {
                context?: Record<string, any>;
                loadQueue?: boolean;
            }, id?: string): import("noodl-ui").NUIActionChain;
            createSrc(key: string, value: string | import("noodl-types").EmitObjectFold<Record<string, any>> | import("noodl-types").IfObject<any, any, any>): Promise<string>;
            emit: {
                <Evt_1 extends string = string>(opts?: import("noodl-ui").NUIEmit.EmitRegister<Evt_1>): Promise<any[]>;
                <Tid_1 extends import("noodl-ui").TransactionId = import("noodl-ui").TransactionId>(obj?: import("noodl-ui").NUIEmit.EmitTransaction<Tid_1>): Promise<Parameters<import("noodl-ui").Transaction[Tid_1]["callback"]>[0]>;
            };
            getBaseStyles: any;
            getQueryObjects: (opts?: {
                component?: import("noodl-ui").NuiComponent.Instance;
                page?: NUIPage;
                queries?: () => Record<string, any> | (() => Record<string, any>)[];
                listDataObject?: any;
            }) => any[];
            on: import("noodl-ui").On;
            page: any;
            resolveComponents: {
                <C_1 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_1 extends Record<string, any> = Record<string, any>>(opts: import("noodl-ui").ResolveComponentOptions<C_1, Context_1>): Promise<C_1 extends C_1[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
                <C_2 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_2 extends Record<string, any> = Record<string, any>>(component: C_2, page?: NUIPage, callback?: ((component: import("noodl-ui").NuiComponent.Instance) => import("noodl-ui").NuiComponent.Instance) | import("noodl-ui").ResolveComponentOptions<C_2, Context_2>): Promise<C_2 extends C_2[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
                <C_3 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_3 extends Record<string, any> = Record<string, any>>(component: C_3, callback?: (component: import("noodl-ui").NuiComponent.Instance) => import("noodl-ui").NuiComponent.Instance): Promise<C_3 extends C_3[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
                <C_4 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_4 extends Record<string, any> = Record<string, any>>(component: C_4, options?: Omit<import("noodl-ui").ResolveComponentOptions<C_4, Context_4>, "component">): Promise<C_4 extends C_4[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
            };
            viewport: any;
            _experimental: {
                readonly register: {
                    (name: string, fn: ((obj: import("noodl-ui").Register.Object<string>, params: import("noodl-ui").Register.Params<any>) => Promise<any>) | Partial<import("noodl-ui").Register.Object<string>>, options?: Partial<import("noodl-ui").Register.Object<string>>): import("noodl-ui").Register.Object<string>;
                    (registerComponent: import("noodl-types").RegisterComponentObject, options?: ((obj: import("noodl-ui").Register.Object<string>, params: import("noodl-ui").Register.Params<any>) => Promise<any>) | Partial<import("noodl-ui").Register.Object<string>>): import("noodl-ui").Register.Object<string>;
                };
            };
            _defineGetter(key: string, opts: PropertyDescriptor | ((...args: any[]) => any)): void;
            clean: (page: NUIPage, onClean?: (stats?: {
                componentsRemoved: number;
            }) => void) => void;
            createGetter: (page?: NUIPage) => (key?: string, { dataObject, iteratorVar, page: priorityPage, pageObject, }?: {
                dataObject?: any;
                iteratorVar?: string;
                page?: NUIPage;
                pageObject?: PageObject;
            }) => any;
            createGoto: (fn: import("noodl-ui").GotoFn) => (args: string | import("noodl-types").GotoObject<string>) => any[];
            createComponent: (componentObject: import("noodl-ui").NuiComponent.Instance | import("noodl-types").ComponentObject<any> | import("noodl-ui").NuiComponentType, page: NUIPage) => import("noodl-ui").NuiComponent.Instance;
            createPlugin(location?: import("noodl-ui").NuiComponent.Instance | import("noodl-ui").Plugin.Location | import("noodl-ui").Plugin.ComponentObject, obj?: import("noodl-ui").NuiComponent.Instance | import("noodl-ui").Plugin.ComponentObject): import("noodl-ui").Plugin.Object;
            getAssetsUrl: () => string;
            getActions: {
                (): import("noodl-ui/dist/cache/ActionsCache").default<string>;
                (actionType: "emit"): Map<NUITrigger, import("noodl-ui").Store.ActionObject<"emit", string>[]>;
                (actionType: "builtIn"): Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
                <AType_1 extends "evalObject" | "openCamera" | "openPhotoLibrary" | "openDocumentManager" | "pageJump" | "popUp" | "popUpDismiss" | "refresh" | "removeSignature" | "saveObject" | "saveSignature" | "getLocationAddress" | "updateObject" | "anonymous" | "goto" | "toast">(actionType: AType_1): import("noodl-ui").Store.ActionObject<AType_1, string>[];
            };
            getBuiltIns: () => Map<string, import("noodl-ui").Store.BuiltInObject<string, string>[]>;
            getBaseUrl: () => string;
            getConsumerOptions({ callback, component, on, page, context, ...rest }: {
                callback?(component: import("noodl-ui").NuiComponent.Instance): import("noodl-ui").NuiComponent.Instance;
                component?: import("noodl-ui").NuiComponent.Instance;
                on?: import("noodl-ui").On;
                page: NUIPage;
                context?: Record<string, any>;
            } & {
                [key: string]: any;
            }): any;
            getPlugins(location?: import("noodl-ui").Plugin.Location): Map<string, import("noodl-ui").Plugin.Object>;
            getPages(): string[];
            getPreloadPages(): string[];
            getRoot(): Record<string, any>;
            getRootPage(): NUIPage;
            reset(): void;
            setLogLevel: (level: keyof import("loglevel").LogLevel) => void;
            use(args: import("noodl-ui").UseArg<Record<string, any>, import("noodl-ui").TransactionId>): any;
        };
        getPlugins(location?: import("noodl-ui").Plugin.Location): Map<string, import("noodl-ui").Plugin.Object>;
        getPages(): string[];
        getPreloadPages(): string[];
        getRoot(): Record<string, any>;
        getRootPage(): NUIPage;
        readonly resolveComponents: {
            <C_1_1 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_1_1 extends Record<string, any> = Record<string, any>>(opts: import("noodl-ui").ResolveComponentOptions<C_1_1, Context_1_1>): Promise<C_1_1 extends C_1_1[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
            <C_2_1 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_2_1 extends Record<string, any> = Record<string, any>>(component: C_2_1, page?: NUIPage, callback?: ((component: import("noodl-ui").NuiComponent.Instance) => import("noodl-ui").NuiComponent.Instance) | import("noodl-ui").ResolveComponentOptions<C_2_1, Context_2_1>): Promise<C_2_1 extends C_2_1[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
            <C_3_1 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_3_1 extends Record<string, any> = Record<string, any>>(component: C_3_1, callback?: (component: import("noodl-ui").NuiComponent.Instance) => import("noodl-ui").NuiComponent.Instance): Promise<C_3_1 extends C_3_1[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
            <C_4_1 extends import("@jsmanifest/typefest").OrArray<import("noodl-ui").NuiComponent.CreateType>, Context_4_1 extends Record<string, any> = Record<string, any>>(component: C_4_1, options?: Omit<import("noodl-ui").ResolveComponentOptions<C_4_1, Context_4_1>, "component">): Promise<C_4_1 extends C_4_1[] ? import("noodl-ui").NuiComponent.Instance[] : import("noodl-ui").NuiComponent.Instance>;
        };
        reset(): void; /**
         * Determining the start page or initial action
         */
        setLogLevel: (level: keyof import("loglevel").LogLevel) => void;
        use(args: import("noodl-ui").UseArg<Record<string, any>, import("noodl-ui").TransactionId>): any;
    };
    get ndom(): NDOM;
    get notification(): AppNotification;
    get parse(): nu.Parser;
    get mainStream(): import("./meeting/Stream").default;
    get selfStream(): import("./meeting/Stream").default;
    get serviceWorker(): ServiceWorker;
    get serviceWorkerRegistration(): ServiceWorkerRegistration | null;
    set serviceWorkerRegistration(reg: ServiceWorkerRegistration | null);
    get subStreams(): import("./meeting/Substreams").default;
    get streams(): import("./meeting/Streams").default;
    get startPage(): string;
    get root(): import("@aitmed/cadl/dist/types").Root;
    get viewport(): VP;
    get piBackgroundWorker(): Worker;
    getState(): {
        authStatus: "" | AuthStatus;
        initialized: boolean;
        loadingPages: Record<string, {
            id: string;
            init: boolean;
        }[]>;
        spinner: t.SpinnerState;
        tracking: {};
    };
    /**
     * Navigates to a page specified in page.requesting
     * The value set in page.requesting should be set prior to this call unless pageRequesting is provided where it will be set to it automatically
     * If only a page name is provided, by default the main page instance will be used
     * @param { NDOMPage } page
     * @param { string | undefined } pageRequesting
     */
    navigate(page: NDOMPage, pageRequesting?: string, opts?: {
        isGoto?: boolean;
    }): Promise<void>;
    navigate(pageRequesting?: string): Promise<void>;
    initialize({ onInitNotification, onSdkInit, }?: {
        onInitNotification?: (notification: AppNotification) => Promise<void>;
        onSdkInit?: (sdk: CADL) => void;
    }): Promise<void>;
    getPageObject(page: NDOMPage): Promise<void | {
        aborted: true;
    }>;
    getRoomParticipants(): Map<string, import("twilio-video").RemoteParticipant>;
    getSdkParticipants(root?: import("@aitmed/cadl/dist/types").Root): t.RemoteParticipant[];
    setSdkParticipants(participants: any[]): import("twilio-video").RemoteParticipant[];
    observeViewport(viewport: VP): void;
    observePages(page: NDOMPage): void;
    render(page: NDOMPage): Promise<import("noodl-ui").NuiComponent.Instance[]>;
    reset(soft?: boolean): Promise<void>;
    reset(): this;
    /**
     * Update pattern #1:
     *    app.updateRoot('SignIn.verificationCode.response', { edge: {...} }, function onUpdate() {...})
     *
     * Update pattern #2:
     *    app.updateRoot((draft) => {
     *      draft.SignIn.verificationCode.response = { edge: {...}}
     *    }, function onUpdate() {...})
     */
    updateRoot<P extends string>(path: P, value: any, cb?: (root: Record<string, any>) => void): void;
    updateRoot(fn: (draft: App['noodl']['root'], cb?: (root: Record<string, any>) => void) => void): void;
    listen<Id extends keyof t.AppObserver, Fn extends t.AppObserver[Id]['fn']>(id: Id, fn: Fn): this;
    emit<Id extends keyof t.AppObserver, P extends t.AppObserver[Id]['params'] = t.AppObserver[Id]['params']>(id: Id, params?: P): void;
    enableSpinner({ delay, page: pageName, target, timeout, trigger, }?: {
        delay?: number;
        page?: string;
        target?: HTMLElement;
        timeout?: number;
        trigger?: t.SpinnerState['trigger'];
    }): void;
    disableSpinner(): void;
    /**
     * Adds the current page name to the end in the list of cached pages
     * @param { string } name - Page name
     */
    cachePage(name: string): Promise<void>;
    /** Retrieves a list of cached pages */
    getCachedPages(): Promise<t.CachedPageObject[]>;
    use(arg: CADL): this;
}
export default App;
