import { Register } from 'noodl-ui';
import App from '../App';
declare type Room = any;
declare function createRegisters(app: App): ["FCMOnTokenReceive" | "onNotificationClicked" | "twilioOnPeopleJoin" | "twilioOnNoParticipant" | "twilioOnPeopleShowRoom", ((obj: Register.Object, { options }?: {
    options?: Record<string, any>;
}) => Promise<any>) | ((obj: Register.Object, arg: any) => Promise<void>) | ((obj: Register.Object, params?: {
    room?: Room;
}) => void) | ((obj: Register.Object, { room }?: {
    room?: Room;
}) => void) | ((obj: Register.Object, arg: any) => Promise<void>)][];
export default createRegisters;
