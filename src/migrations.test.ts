import { describe, it, expect } from 'vitest';
import type { TimerConfig } from './types';
import { migrateSettings } from './migrations';

function makeLegacyTimer(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'legacy',
        emoji: '💼',
        name: 'Old workday',
        type: 'workday',
        color: '#7c6af7',
        notifyStart: false,
        notifyEnd: false,
        notifiedStart: false,
        notifiedEnd: false,
        startTime: '09:00',
        endTime: '18:00',
        targetDatetime: '',
        startDatetime: '',
        workHours: 8,
        lunchMin: 60,
        ...overrides,
    };
}

describe('migrateSettings', () => {
    it('does not modify timers that already have valid types', () => {
        const timers: TimerConfig[] = [
            {
                id: 'r1',
                emoji: '💼',
                name: 'Range',
                type: 'range',
                color: '#7c6af7',
                notifyStart: false,
                notifyEnd: false,
                notifiedStart: false,
                notifiedEnd: false,
                startTime: '09:00',
                endTime: '18:00',
                targetDatetime: '',
                startDatetime: '',
            },
            {
                id: 'c1',
                emoji: '📅',
                name: 'Countdown',
                type: 'countdown',
                color: '#7c6af7',
                notifyStart: false,
                notifyEnd: false,
                notifiedStart: false,
                notifiedEnd: false,
                startTime: '00:00',
                endTime: '00:00',
                targetDatetime: '2026-06-01T18:00',
                startDatetime: '2026-01-01T09:00',
            },
        ];

        migrateSettings(timers);

        expect(timers[0].type).toBe('range');
        expect(timers[0].endTime).toBe('18:00');
        expect(timers[1].type).toBe('countdown');
    });

    it('migrates workday type to range with correct endTime', () => {
        const timers = [
            makeLegacyTimer({
                startTime: '09:00',
                workHours: 8,
                lunchMin: 60,
            }),
        ] as unknown as TimerConfig[];

        migrateSettings(timers);

        expect(timers[0].type).toBe('range');
        expect(timers[0].endTime).toBe('18:00');
    });

    it('uses default values when workHours and lunchMin are missing', () => {
        const timers = [
            makeLegacyTimer({
                startTime: '09:00',
                workHours: undefined,
                lunchMin: undefined,
            }),
        ] as unknown as TimerConfig[];

        migrateSettings(timers);

        expect(timers[0].type).toBe('range');
        expect(timers[0].endTime).toBe('17:00');
    });

    it('handles custom workHours and lunchMin', () => {
        const timers = [
            makeLegacyTimer({
                startTime: '08:00',
                workHours: 10,
                lunchMin: 30,
            }),
        ] as unknown as TimerConfig[];

        migrateSettings(timers);

        expect(timers[0].type).toBe('range');
        expect(timers[0].endTime).toBe('18:30');
    });

    it('handles zero workHours and zero lunchMin', () => {
        const timers = [
            makeLegacyTimer({
                startTime: '09:00',
                workHours: 0,
                lunchMin: 0,
            }),
        ] as unknown as TimerConfig[];

        migrateSettings(timers);

        expect(timers[0].type).toBe('range');
        expect(timers[0].endTime).toBe('09:00');
    });

    it('migrates only workday timers in a mixed array', () => {
        const timers = [
            makeLegacyTimer({ id: 'old1', startTime: '09:00', workHours: 8, lunchMin: 0 }),
            {
                id: 'good',
                emoji: '📅',
                name: 'Countdown',
                type: 'countdown',
                color: '#7c6af7',
                notifyStart: false,
                notifyEnd: false,
                notifiedStart: false,
                notifiedEnd: false,
                startTime: '00:00',
                endTime: '00:00',
                targetDatetime: '2026-06-01T18:00',
                startDatetime: '2026-01-01T09:00',
            },
        ] as unknown as TimerConfig[];

        migrateSettings(timers);

        expect(timers[0].type).toBe('range');
        expect(timers[0].endTime).toBe('17:00');
        expect(timers[1].type).toBe('countdown');
    });
});
