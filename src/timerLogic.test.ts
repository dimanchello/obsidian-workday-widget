import { describe, it, expect } from 'vitest';
import type { TimerConfig } from './types';
import { calcRange, calcCountdown } from './timerLogic';

function makeTimer(overrides: Partial<TimerConfig> = {}): TimerConfig {
    return {
        id: 'test',
        emoji: '💼',
        name: '',
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
        ...overrides,
    };
}

describe('calcRange', () => {
    it('returns running state when now is within range', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '18:00' });
        const now = new Date(2026, 0, 1, 13, 30, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('running');
        expect(r.pct).toBeGreaterThan(0);
        expect(r.pct).toBeLessThan(100);
        expect(r.passedM).toBeGreaterThan(0);
        expect(r.leftM).toBeGreaterThan(0);
        expect(r.totalM).toBe(540);
    });

    it('returns before state when now is before start', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '18:00' });
        const now = new Date(2026, 0, 1, 7, 0, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('before');
        expect(r.pct).toBe(0);
        expect(r.passedM).toBe(0);
        expect(r.leftM).toBe(120);
    });

    it('returns done state when now is after end', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '18:00' });
        const now = new Date(2026, 0, 1, 20, 0, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('done');
        expect(r.pct).toBe(100);
        expect(r.passedM).toBe(540);
        expect(r.leftM).toBe(0);
    });

    it('returns invalid state when start >= end', () => {
        const timer = makeTimer({ startTime: '18:00', endTime: '09:00' });
        const now = new Date(2026, 0, 1, 12, 0, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('invalid');
        expect(r.totalM).toBe(0);
    });

    it('returns invalid state when start equals end', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '09:00' });
        const now = new Date(2026, 0, 1, 9, 0, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('invalid');
    });

    it('calculates correct percentage mid-range', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '17:00' });
        const now = new Date(2026, 0, 1, 13, 0, 0);
        const r = calcRange(timer, now);
        expect(r.pct).toBe(50);
    });

    it('calculates correct percentage at exact start', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '18:00' });
        const now = new Date(2026, 0, 1, 9, 0, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('running');
        expect(r.pct).toBe(0);
    });

    it('calculates correct percentage at exact end', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '18:00' });
        const now = new Date(2026, 0, 1, 18, 0, 0);
        const r = calcRange(timer, now);
        expect(r.status).toBe('done');
        expect(r.pct).toBe(100);
    });

    it('handles single-minute ranges', () => {
        const timer = makeTimer({ startTime: '09:00', endTime: '09:01' });
        const now = new Date(2026, 0, 1, 9, 0, 30);
        const r = calcRange(timer, now);
        expect(r.status).toBe('running');
        expect(r.totalM).toBe(1);
        expect(r.pct).toBe(50);
    });
});

describe('calcCountdown', () => {
    it('returns no-target when targetDatetime is empty', () => {
        const timer = makeTimer({ type: 'countdown', targetDatetime: '' });
        const now = new Date(2026, 0, 1, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('no-target');
    });

    it('returns bad-target when targetDatetime is invalid', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-13-01T12:00',
        });
        const now = new Date(2026, 0, 1, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('bad-target');
    });

    it('returns bad-start when startDatetime is invalid', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T12:00',
            startDatetime: '2026-13-01T12:00',
        });
        const now = new Date(2026, 0, 1, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('bad-start');
    });

    it('returns running state when target is in the future', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T18:00',
            startDatetime: '2026-01-01T09:00',
        });
        const now = new Date(2026, 3, 15, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('running');
        expect(r.isDone).toBe(false);
        expect(r.leftSec).toBeGreaterThan(0);
        expect(r.totalSec).toBeGreaterThan(0);
        expect(r.passedSec).toBeGreaterThan(0);
        expect(r.hasStart).toBe(true);
        expect(r.startDate).toBeInstanceOf(Date);
        expect(r.targetDate).toBeInstanceOf(Date);
    });

    it('returns done state when target is in the past', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-01-01T12:00',
            startDatetime: '2025-12-01T09:00',
        });
        const now = new Date(2026, 5, 1, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('done');
        expect(r.isDone).toBe(true);
        expect(r.leftSec).toBe(0);
    });

    it('returns 0% when not started and no startDatetime', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T18:00',
            startDatetime: '',
        });
        const now = new Date(2026, 0, 1, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('running');
        expect(r.pct).toBe(0);
        expect(r.hasStart).toBe(false);
        expect(r.totalSec).toBeNull();
        expect(r.passedSec).toBeNull();
    });

    it('returns 100% when done without startDatetime', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-01-01T12:00',
            startDatetime: '',
        });
        const now = new Date(2026, 5, 1, 12, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('done');
        expect(r.pct).toBe(100);
    });

    it('calculates correct progress percentage', () => {
        const start = '2026-01-01T00:00';
        const target = '2026-01-11T00:00';
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: target,
            startDatetime: start,
        });
        const halfway = new Date(2026, 0, 6, 0, 0, 0);
        const r = calcCountdown(timer, halfway);
        expect(r.pct).toBe(50);
    });

    it('shows time until start when before start, not time until target', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T18:00',
            startDatetime: '2026-06-01T09:00',
        });
        const now = new Date(2026, 5, 1, 7, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('before');
        expect(r.leftSec).toBe(2 * 3600);
        expect(r.passedSec).toBe(0);
        expect(r.isDone).toBe(false);
    });

    it('returns invalid-range when startDatetime is equal or after targetDatetime', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T10:00',
            startDatetime: '2026-06-01T12:00',
        });
        const now = new Date(2026, 5, 1, 9, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('invalid-range');
    });

    it('handles targetDatetime with seconds properly', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T18:00:30',
            startDatetime: '2026-06-01T18:00:00',
        });
        const now = new Date(2026, 5, 1, 18, 0, 15);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('running');
        expect(r.leftSec).toBe(15);
        expect(r.passedSec).toBe(15);
        expect(r.pct).toBe(50);
    });

    it('handles exact match when now equals targetDatetime', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T18:00',
            startDatetime: '2026-06-01T09:00',
        });
        const now = new Date(2026, 5, 1, 18, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('done');
        expect(r.isDone).toBe(true);
        expect(r.pct).toBe(100);
        expect(r.leftSec).toBe(0);
    });

    it('handles exact match when now equals startDatetime', () => {
        const timer = makeTimer({
            type: 'countdown',
            targetDatetime: '2026-06-01T18:00',
            startDatetime: '2026-06-01T09:00',
        });
        const now = new Date(2026, 5, 1, 9, 0, 0);
        const r = calcCountdown(timer, now);
        expect(r.status).toBe('running');
        expect(r.isDone).toBe(false);
        expect(r.passedSec).toBe(0);
        expect(r.pct).toBe(0);
    });
});
