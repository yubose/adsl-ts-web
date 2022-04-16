/// <reference types="node" />
import firebase from 'firebase';
import type { CADL, Account } from '@aitmed/cadl';
import { NDOM, NUI, NUIAction, NUITrigger, Viewport } from 'noodl-ui';
import { ActionObject, PageObject, RegisterComponentObject } from 'noodl-types';
import AppNotification from '../Notifications';
import createMeetingFns from '../../meeting';
export * from './domTypes';
export * from './meetingTypes';
export * from './twilio';
export interface AppConstructorOptions {
    configKey?: string;
    getStatus?: typeof Account.getStatus;
    meeting?: Meeting | typeof createMeetingFns;
    notification?: AppNotification;
    noodl?: CADL;
    ndom?: NDOM;
    nui?: typeof NUI;
    viewport?: Viewport;
}
export declare type AuthStatus = 'logged.in' | 'logged.out' | 'new.device' | 'temporary' | null;
export declare type AppObservers<Id extends keyof AppObserver = keyof AppObserver> = Map<Id, AppObserver[Id]['fn'][]>;
export interface AppObserver {
    onInitPage: {
        fn: (pageObject: PageObject) => void;
        params: PageObject;
    };
}
export declare type ActionMetadata<PKey extends string = string> = {
    action: {
        instance: NUIAction | undefined;
        object: ActionObject;
    };
    trigger: NUITrigger;
} & Record<PKey, Record<string, any> | {
    fromAction?: any;
    fromComponent?: any;
}> & Record<string, any>;
export declare type Meeting = ReturnType<typeof createMeetingFns>;
export declare type FirebaseApp = firebase.app.App;
export declare type FirebaseMessaging = firebase.messaging.Messaging;
export interface AppNotificationHooks {
    message<Msg extends AppNotificationMessageObject = AppNotificationMessageObject>(msg: Msg): void;
    error(error: Error): void;
    complete(): void;
    initiated(client: firebase.app.App): void;
    initError(error: Error): void;
    token(token: string): void;
}
export declare type AppNotificationHook = keyof AppNotificationHooks;
export interface AppNotificationMessageObject<O extends Record<string, any> = Record<string, any>> {
    data: O;
    from?: string;
    priority?: 'normal';
}
export interface SpinnerState {
    active: boolean;
    config: {
        delay: number;
        timeout: number;
    };
    page: string | null;
    ref: null | NodeJS.Timeout;
    timeout: null | NodeJS.Timeout;
    trigger: 'inject' | NUITrigger | null;
}
export interface CachedPageObject {
    name: string;
    timestamp: number;
}
export interface GlobalRegisterComponent<EventId extends string = string> extends Omit<RegisterComponentObject, 'onEvent'> {
    type: 'register';
    eventId: EventId;
    onEvent(...args: any[]): any;
}
