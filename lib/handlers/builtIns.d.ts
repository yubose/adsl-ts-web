import { BuiltInActionObject, EcosDocument } from 'noodl-types';
import App from '../App';
declare const createBuiltInActions: (app: App) => Record<"goto" | "dismissOnTouchOutside" | "copy" | "show" | "hide" | "checkField" | "disconnectMeeting" | "exportCSV" | "exportPDF" | "goBack" | "toggleCameraOnOff" | "toggleMicrophoneOnOff" | "toggleFlag" | "lockApplication" | "logOutOfApplication" | "logout" | "redraw", (action: import("noodl-action-chain/dist/Action").default<"builtIn", string>, options: any) => Promise<void | any[]>>;
export declare const extendedSdkBuiltIns: {
    /**
     * Called when user clicks the download icon. The passed in args should contain
     * the ecosObj that contains the file data
     */
    download(this: App, { ecosObj }?: {
        ecosObj?: EcosDocument<any>;
    }): void;
    downloadQRCode(this: App, { content, scale, viewTag, }?: {
        content?: any;
        scale?: number;
        viewTag?: string;
    }): void;
    /**
     * Called during "init" when navigating to VideoChat
     */
    videoChat(this: App, action: BuiltInActionObject & {
        roomId: string;
        accessToken: string;
        timer: number;
        timerTag: string;
    }): Promise<void>;
};
export default createBuiltInActions;
