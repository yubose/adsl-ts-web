import type { NuiComponent } from 'noodl-ui';
import Stream from '../meeting/Stream';
import { Meeting } from '../app/types';
import { RemoteParticipant } from '../app/types';
import App from '../App';
declare const createMeetingHandlers: (app: App) => {
    createElementBinding: (component: NuiComponent.Instance) => HTMLDivElement;
    onConnected: (room: Meeting['room']) => Promise<void>;
    onAddRemoteParticipant: (participant: RemoteParticipant, stream: Stream) => void;
    onRemoveRemoteParticipant: () => void;
};
export default createMeetingHandlers;
