import type { CADL } from '@aitmed/cadl';
import type { NuiComponent } from 'noodl-ui';
declare const is: {
    lvl3Sdk: (arg: unknown) => arg is CADL;
    /**
     * Returns true if the component has any of these props:
     * 1. audioStream: true
     * 2. videoStream: true
     * 3. viewTag: 'selfStream'
     * @param { NuiComponent.Instance } component
     * @returns { boolean }
     */
    isGlobalStreamComponent: (component: NuiComponent.Instance) => boolean;
    folds: {
        actionChain: (v: any) => v is (import("noodl-types").ActionObject<string> | import("noodl-types").EmitObjectFold<Record<string, any>> | import("noodl-types").GotoObject<string>)[];
        component: {
            any<O extends Record<string, any>>(v: unknown): v is import("noodl-types").ComponentObject<any> & O;
        } & {
            page: <K extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K;
            };
            popUp: <K_1 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_1;
            };
            register: <K_2 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_2;
            };
            button: <K_3 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_3;
            };
            canvas: <K_4 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_4;
            };
            chart: <K_5 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_5;
            };
            chatList: <K_6 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_6;
            };
            ecosDoc: <K_7 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_7;
            };
            divider: <K_8 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_8;
            };
            footer: <K_9 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_9;
            };
            header: <K_10 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_10;
            };
            image: <K_11 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_11;
            };
            label: <K_12 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_12;
            };
            list: <K_13 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_13;
            };
            listItem: <K_14 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_14;
            };
            map: <K_15 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_15;
            };
            plugin: <K_16 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_16;
            };
            pluginHead: <K_17 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_17;
            };
            pluginBodyTail: <K_18 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_18;
            };
            select: <K_19 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_19;
            };
            scrollView: <K_20 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_20;
            };
            textField: <K_21 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_21;
            };
            textView: <K_22 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_22;
            };
            video: <K_23 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_23;
            };
            view: <K_24 extends "register" | "popUp" | "page" | "canvas" | "button" | "footer" | "header" | "label" | "map" | "select" | "video" | "image" | "view" | "chart" | "chatList" | "divider" | "ecosDoc" | "plugin" | "pluginHead" | "pluginBodyTail" | "textField" | "list" | "listItem" | "textView" | "scrollView">(v: unknown) => v is Omit<import("noodl-types").ActionObject<string>, "type"> & {
                type: K_24;
            };
        };
        emit: (v: any) => v is import("noodl-types").EmitObjectFold<Record<string, any>>;
        goto: (v: any) => v is {
            goto: string | import("noodl-types").GotoObject<string>;
        };
        if: (v: any) => v is {
            if: import("noodl-types").IfObject<any, any, any>;
        };
        path: (v: any) => v is {
            path: string | import("noodl-types").EmitObjectFold<Record<string, any>> | import("noodl-types").IfObject<any, any, any> | import("noodl-types").IfObject<any, any, any>;
        };
        textFunc: (v: any) => v is {
            path: string | import("noodl-types").EmitObjectFold<Record<string, any>> | import("noodl-types").IfObject<any, any, any> | import("noodl-types").IfObject<any, any, any>;
        };
        toast: (v: any) => v is {
            toast: import("noodl-types").ToastObject;
        };
    };
    rootConfig: (v: any) => v is import("noodl-types").RootConfig;
    appConfig: (v: any) => v is import("noodl-types").AppConfig;
    action: {
        any: (v: any) => v is import("noodl-types").ActionObject<string>;
        builtIn: (v: any) => v is import("noodl-types").BuiltInActionObject;
        evalObject: (v: any) => v is import("noodl-types").EvalActionObject;
        getLocationAddress: (v: any) => v is import("noodl-types").GetLocationAddressActionObject;
        openCamera: (v: any) => v is import("noodl-types").OpenCameraActionObject;
        openPhotoLibrary: (v: any) => v is import("noodl-types").OpenPhotoLibraryActionObject;
        openDocumentManager: (v: any) => v is import("noodl-types").OpenDocumentManagerActionObject;
        pageJump: (v: any) => v is import("noodl-types").PageJumpActionObject;
        popUp: (v: any) => v is import("noodl-types").PopupActionObject;
        popUpDismiss: (v: any) => v is import("noodl-types").PopupDismissActionObject;
        refresh: (v: any) => v is import("noodl-types").RefreshActionObject;
        removeSignature: (v: any) => v is import("noodl-types").RemoveSignatureActionObject;
        saveObject: (v: any) => v is import("noodl-types").SaveActionObject;
        saveSignature: (v: any) => v is import("noodl-types").SaveSignatureActionObject;
        updateObject: (v: any) => v is import("noodl-types").UpdateActionObject;
    };
    actionChain(v: unknown): boolean;
    isBoolean(value: unknown): boolean;
    isBooleanTrue(value: unknown): value is true | "true";
    isBooleanFalse(value: unknown): value is false | "false";
    component: {
        button: (v: any) => v is import("noodl-types").ButtonComponentObject;
        canvas: (v: any) => v is import("noodl-types").CanvasComponentObject;
        divider: (v: any) => v is import("noodl-types").DividerComponentObject;
        ecosDoc: (v: any) => v is import("noodl-types").EcosDocComponentObject;
        footer: (v: any) => v is import("noodl-types").FooterComponentObject;
        header: (v: any) => v is import("noodl-types").HeaderComponentObject;
        image: (v: any) => v is import("noodl-types").ImageComponentObject;
        label: (v: any) => v is import("noodl-types").LabelComponentObject;
        list: (v: any) => v is import("noodl-types").ListComponentObject;
        listLike: (v: any) => v is import("noodl-types").ListComponentObject | import("noodl-types").ChatListComponentObject;
        listItem: (v: any) => v is import("noodl-types").ListItemComponentObject;
        map: (v: any) => v is import("noodl-types").MapComponentObject;
        page: (v: any) => v is import("noodl-types").PageComponentObject;
        plugin: (v: any) => v is import("noodl-types").PluginComponentObject;
        pluginHead: (v: any) => v is import("noodl-types").PluginHeadComponentObject;
        pluginBodyTop: (v: any) => v is import("noodl-types").PluginBodyTopComponentObject;
        pluginBodyTail: (v: any) => v is import("noodl-types").PluginBodyTailComponentObject;
        popUp: (v: any) => v is import("noodl-types").PopUpComponentObject;
        register: (v: any) => v is import("noodl-types").RegisterComponentObject;
        select: (v: any) => v is import("noodl-types").SelectComponentObject;
        scrollView: (v: any) => v is import("noodl-types").ScrollViewComponentObject;
        textField: (v: any) => v is import("noodl-types").TextFieldComponentObject;
        textView: (v: any) => v is import("noodl-types").TextViewComponentObject;
        video: (v: any) => v is import("noodl-types").VideoComponentObject;
        view: (v: any) => v is import("noodl-types").ViewComponentObject;
    };
    ecosObj: {
        audio(v: unknown): void;
        doc: (v: any) => v is import("noodl-types").EcosDocument<import("noodl-types").NameField<"application/json" | "application/pdf">, 1>;
        font(v: unknown): void;
        image: (v: any) => v is import("noodl-types").EcosDocument<import("noodl-types").NameField<"image/png" | "image/svg" | "image/ai" | "image/bmp" | "image/eps" | "image/gif" | "image/jpg" | "image/jpeg" | "image/psd" | "image/tiff" | "image/webp">, 4>;
        message(v: unknown): void;
        model(v: unknown): void;
        multipart(v: unknown): void;
        other: (v: any) => v is import("noodl-types").EcosDocument<import("noodl-types").NameField<any>, 0>;
        text: (v: any) => v is import("noodl-types").EcosDocument<import("noodl-types").NameField<"text/html" | "text/css" | "text/javascript" | "text/plain">, 0 | 8>;
        video: (v: any) => v is import("noodl-types").EcosDocument<import("noodl-types").NameField<"video/ogg" | "video/webm" | "video/avi" | "video/flv" | "video/mkv" | "video/mov" | "video/mpg" | "video/mp4" | "video/wmv">, 9>;
    };
    emit: (v: any) => v is import("noodl-types").EmitObject;
    goto: (v: any) => v is import("noodl-types").GotoObject<string>;
    if: (v: any) => v is import("noodl-types").IfObject<any, any, any>;
    mediaType: {
        audio: (v: any) => v is 2;
        doc: (v: any) => v is 1;
        font: (v: any) => v is 3;
        image: (v: any) => v is 4;
        message: (v: any) => v is 5;
        model: (v: any) => v is 6;
        multipart: (v: any) => v is 7;
        other: (v: any) => v is 0;
        text: (v: any) => v is 8;
        video: (v: any) => v is 9;
    };
    rootKey: (v?: string) => boolean;
    localKey: (v?: string) => boolean;
    reference: (v: any) => v is `=.${string}` | `.${string}` | `..${string}` | `=..${string}` | `~/${string}` | `${string}@`;
    localReference: typeof import("noodl-types/dist/utils/isLocalReference").default;
    awaitReference: typeof import("noodl-types/dist/utils/isAwaitReference").default;
    evalReference: typeof import("noodl-types/dist/utils/isEvalReference").default;
    evalLocalReference: typeof import("noodl-types/dist/utils/isEvalLocalReference").default;
    evalRootReference: typeof import("noodl-types/dist/utils/isEvalRootReference").default;
    rootReference: typeof import("noodl-types/dist/utils/isRootReference").default;
    tildeReference: typeof import("noodl-types/dist/utils/isTildeReference").default;
    traverseReference: typeof import("noodl-types/dist/utils/isTraverseReference").default;
    pageComponentUrl<S extends string>(v: S): boolean;
    textBoard(v: unknown): v is import("noodl-types").TextBoardObject;
    textBoardItem<O_1 extends "br" | {
        br: any;
    }>(v: O_1): boolean;
};
export default is;
