import { Notice } from 'obsidian';
import type { TimerConfig } from './types';
import { t } from './i18n';

export function sendNotification(timer: TimerConfig, type: 'start' | 'end' = 'end'): void {
    const name = timer.name?.trim();
    const title = t('notificationTitle');
    const key =
        type === 'start'
            ? name
                ? 'notificationBodyStart'
                : 'notificationBodyNoNameStart'
            : name
              ? 'notificationBody'
              : 'notificationBodyNoName';
    const body = t(key, name ? { name } : { emoji: timer.emoji });

    new Notice(`${title}: ${body}`, 5000);

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification(title, { body, silent: false });
    } else if (Notification.permission !== 'denied') {
        void Notification.requestPermission().then((p) => {
            if (p === 'granted') new Notification(title, { body, silent: false });
        });
    }
}
