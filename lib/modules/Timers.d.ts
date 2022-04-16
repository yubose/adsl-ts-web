import Timer, { TimerObject } from './Timer';
declare class Timers {
    store: Map<string, Timer>;
    get(page: string): Timer;
    has(page: string): boolean;
    set(page: string, obj: Partial<Omit<TimerObject, 'page'>>): Timer;
    create<InitialValues extends Partial<Pick<TimerObject, 'dataKey' | 'value'>> & {
        page: TimerObject['page'];
    } & Pick<Partial<Timer>, 'increment' | 'onClear' | 'onStart' | 'onStop'>>(timerObj: InitialValues): Timer;
}
export default Timers;
