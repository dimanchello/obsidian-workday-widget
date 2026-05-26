import { TimerConfig } from './types';
import { t } from './i18n';

export function sendNotification(timer: TimerConfig): void {
    const name = timer.name?.trim();
    const title = t('notificationTitle');
    const body = name
        ? t('notificationBody', { name })
        : t('notificationBodyNoName', { emoji: timer.emoji });

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification(title, { body, silent: false });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((p) => {
            if (p === 'granted') new Notification(title, { body, silent: false });
        });
    }
}
