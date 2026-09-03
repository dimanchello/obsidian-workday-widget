import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TimerConfig } from './types';
import { sendNotification } from './notifications';

const noticeMock = vi.fn();
vi.mock('obsidian', () => ({
    Notice: class {
        constructor(msg: string, timeout: number) {
            noticeMock(msg, timeout);
        }
    },
}));

function makeTimer(overrides: Partial<TimerConfig> = {}): TimerConfig {
    return {
        id: 'test',
        emoji: '💼',
        name: 'Work',
        type: 'range',
        color: '#7c6af7',
        notifyStart: true,
        notifyEnd: true,
        notifiedStart: false,
        notifiedEnd: false,
        startTime: '09:00',
        endTime: '18:00',
        targetDatetime: '',
        startDatetime: '',
        ...overrides,
    };
}

describe('sendNotification', () => {
    const notificationConstructor = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        const notificationClass = class {
            constructor(title: string, options: unknown) {
                notificationConstructor(title, options);
            }
            static permission = 'granted';
            static requestPermission = vi.fn().mockResolvedValue('granted');
        };

        Object.defineProperty(globalThis, 'Notification', {
            value: notificationClass,
            writable: true,
            configurable: true,
        });

        Object.defineProperty(globalThis, 'window', {
            value: {
                Notification: notificationClass,
            },
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates a Notice and a window Notification when start notification triggers', () => {
        const timer = makeTimer({ name: 'Work', emoji: '💼' });
        sendNotification(timer, 'start');

        expect(noticeMock).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(expect.stringContaining('Work'), 5000);
        expect(notificationConstructor).toHaveBeenCalledTimes(1);
        const [title, options] = notificationConstructor.mock.calls[0] as [
            string,
            { body: string; silent: boolean },
        ];
        expect(title).toBe('⏱️ Workday Widget');
        expect(options.body).toContain('Work');
        expect(options.silent).toBe(false);
    });

    it('formats notification with emoji when timer name is empty', () => {
        const timer = makeTimer({ name: '', emoji: '🏖️' });
        sendNotification(timer, 'end');

        expect(noticeMock).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(expect.stringContaining('🏖️'), 5000);
        const [title, options] = notificationConstructor.mock.calls[0] as [
            string,
            { body: string },
        ];
        expect(title).toBe('⏱️ Workday Widget');
        expect(options.body).toContain('🏖️');
    });
});
