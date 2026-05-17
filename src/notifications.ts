import { TimerConfig } from './types';

export function sendNotification(timer: TimerConfig): void {
    const name = timer.name?.trim() || `${timer.emoji} Таймер`;
    const title = '⏱️ Workday Widget';
    const body = `Таймер "${name}" завершился!`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification(title, { body, silent: false });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((p) => {
            if (p === 'granted') new Notification(title, { body, silent: false });
        });
    }
}
