import 'firebase/app';
import 'firebase/auth';
import 'firebase/messaging';
import firebase from 'firebase/app';
import { FirebaseMessaging, AppNotificationHook, AppNotificationHooks, AppNotificationMessageObject } from './types';
export interface Options {
}
declare class AppNotification {
    #private;
    client: firebase.app.App | undefined;
    initiated: boolean;
    messaging: FirebaseMessaging | undefined;
    get hooks(): Map<keyof AppNotificationHooks, ((<Msg extends AppNotificationMessageObject<Record<string, any>> = AppNotificationMessageObject<Record<string, any>>>(msg: Msg) => void) | ((error: Error) => void) | (() => void) | ((client: firebase.app.App) => void) | ((error: Error) => void) | ((token: string) => void))[]>;
    get supported(): boolean;
    get unsubscribe(): firebase.Unsubscribe;
    set unsubscribe(unsubscribe: firebase.Unsubscribe);
    init(): Promise<firebase.app.App>;
    getToken(opts?: Parameters<firebase.messaging.Messaging['getToken']>[0]): Promise<string>;
    emit<Hook extends AppNotificationHook>(hook: Hook, ...args: Parameters<AppNotificationHooks[Hook]>): void;
    on<Hook extends AppNotificationHook>(hook: Hook, fn: AppNotificationHooks[Hook]): this;
}
export default AppNotification;
