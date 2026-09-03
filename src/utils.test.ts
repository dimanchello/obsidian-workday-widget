import { describe, it, expect } from 'vitest';
import {
    toMin,
    fromMin,
    durStr,
    durStrShort,
    todayStr,
    uid,
    isValidDate,
    parseDatetime,
    adjustIndexOnDelete,
    adjustIndexOnMove,
    debounce,
} from './utils';

describe('toMin', () => {
    it('converts valid time string to minutes', () => {
        expect(toMin('09:00')).toBe(540);
        expect(toMin('18:30')).toBe(1110);
        expect(toMin('00:00')).toBe(0);
        expect(toMin('23:59')).toBe(1439);
    });

    it('handles single-digit hours', () => {
        expect(toMin('9:30')).toBe(570);
    });

    it('returns 0 for empty string', () => {
        expect(toMin('')).toBe(0);
    });

    it('returns 0 for undefined-like values via fallback', () => {
        expect(toMin('')).toBe(0);
    });

    it('handles incomplete time string (only hours)', () => {
        expect(toMin('9')).toBe(540);
    });
});

describe('fromMin', () => {
    it('converts minutes to HH:MM format', () => {
        expect(fromMin(540)).toBe('09:00');
        expect(fromMin(1110)).toBe('18:30');
        expect(fromMin(0)).toBe('00:00');
        expect(fromMin(1439)).toBe('23:59');
    });

    it('handles overflow past 24 hours (wraps around)', () => {
        expect(fromMin(1440)).toBe('00:00');
        expect(fromMin(1500)).toBe('01:00');
    });

    it('clamps negative values to 00:00', () => {
        expect(fromMin(-10)).toBe('00:00');
        expect(fromMin(-60)).toBe('00:00');
    });

    it('rounds fractional minutes correctly', () => {
        expect(fromMin(59.5)).toBe('01:00');
        expect(fromMin(90.4)).toBe('01:30');
        expect(fromMin(90.6)).toBe('01:31');
    });
});

describe('durStr', () => {
    it('formats seconds to human-readable duration', () => {
        expect(durStr(0)).toBe('0с');
        expect(durStr(45)).toBe('45с');
        expect(durStr(125)).toBe('2м 5с');
        expect(durStr(3661)).toBe('1ч 1м');
        expect(durStr(90061)).toBe('1д 1ч 1м');
    });

    it('handles large durations', () => {
        expect(durStr(86400)).toBe('1д 0ч 0м');
        expect(durStr(172800)).toBe('2д 0ч 0м');
    });

    it('clamps negative values to 0', () => {
        expect(durStr(-100)).toBe('0с');
    });

    it('rounds fractional seconds', () => {
        expect(durStr(59.6)).toBe('1м 0с');
        expect(durStr(59.4)).toBe('59с');
    });
});

describe('durStrShort', () => {
    it('formats minutes to short duration string', () => {
        expect(durStrShort(0)).toBe('0м');
        expect(durStrShort(45)).toBe('45м');
        expect(durStrShort(60)).toBe('1ч');
        expect(durStrShort(90)).toBe('1ч 30м');
        expect(durStrShort(150)).toBe('2ч 30м');
    });

    it('clamps negative values to 0', () => {
        expect(durStrShort(-10)).toBe('0м');
    });

    it('rounds fractional minutes', () => {
        expect(durStrShort(59.6)).toBe('1ч');
        expect(durStrShort(59.4)).toBe('59м');
    });
});

describe('todayStr', () => {
    it('returns a date string in YYYY-MM-DD format', () => {
        const result = todayStr();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns today date', () => {
        const now = new Date();
        const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        expect(todayStr()).toBe(expected);
    });
});

describe('uid', () => {
    it('generates a 7-character string', () => {
        expect(uid()).toHaveLength(7);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(uid());
        }
        expect(ids.size).toBe(100);
    });

    it('contains only lowercase alphanumeric characters', () => {
        expect(uid()).toMatch(/^[a-z0-9]+$/);
    });
});

describe('isValidDate', () => {
    it('returns true for valid dates', () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate(new Date('2025-01-15T10:00:00'))).toBe(true);
        expect(isValidDate(new Date(0))).toBe(true);
    });

    it('returns false for invalid dates', () => {
        expect(isValidDate(new Date('invalid'))).toBe(false);
        expect(isValidDate(new Date('abc'))).toBe(false);
        expect(isValidDate(new Date('2025-99-99'))).toBe(false);
    });

    it('returns false for non-Date objects', () => {
        expect(isValidDate(null as unknown as Date)).toBe(false);
        expect(isValidDate(undefined as unknown as Date)).toBe(false);
        expect(isValidDate('2025-01-01' as unknown as Date)).toBe(false);
        expect(isValidDate(12345 as unknown as Date)).toBe(false);
    });
});

describe('durStr with locales', () => {
    it('formats duration with english units', () => {
        expect(durStr(0, 'en')).toBe('0s');
        expect(durStr(45, 'en')).toBe('45s');
        expect(durStr(125, 'en')).toBe('2m 5s');
        expect(durStr(3661, 'en')).toBe('1h 1m');
        expect(durStr(90061, 'en')).toBe('1d 1h 1m');
    });

    it('formats short duration with english units', () => {
        expect(durStrShort(0, 'en')).toBe('0m');
        expect(durStrShort(45, 'en')).toBe('45m');
        expect(durStrShort(60, 'en')).toBe('1h');
        expect(durStrShort(90, 'en')).toBe('1h 30m');
    });
});

describe('parseDatetime', () => {
    it('parses YYYY-MM-DDTHH:mm format by appending :00', () => {
        const d = parseDatetime('2026-06-01T15:30');
        expect(d).not.toBeNull();
        expect(d?.getFullYear()).toBe(2026);
        expect(d?.getMonth()).toBe(5);
        expect(d?.getDate()).toBe(1);
        expect(d?.getHours()).toBe(15);
        expect(d?.getMinutes()).toBe(30);
        expect(d?.getSeconds()).toBe(0);
    });

    it('parses YYYY-MM-DDTHH:mm:ss format directly without double appending', () => {
        const d = parseDatetime('2026-06-01T15:30:45');
        expect(d).not.toBeNull();
        expect(d?.getSeconds()).toBe(45);
    });

    it('returns null for empty or invalid strings', () => {
        expect(parseDatetime('')).toBeNull();
        expect(parseDatetime('   ')).toBeNull();
        expect(parseDatetime('invalid-date')).toBeNull();
        expect(parseDatetime('2026-99-99T99:99')).toBeNull();
    });
});

describe('adjustIndexOnDelete', () => {
    it('returns 0 when totalCount <= 1', () => {
        expect(adjustIndexOnDelete(0, 0, 1)).toBe(0);
        expect(adjustIndexOnDelete(0, 0, 0)).toBe(0);
    });

    it('decrements activeIndex when deleted index is before current active', () => {
        expect(adjustIndexOnDelete(2, 0, 4)).toBe(1);
        expect(adjustIndexOnDelete(2, 1, 4)).toBe(1);
    });

    it('clamps activeIndex when deleted index is the current active', () => {
        expect(adjustIndexOnDelete(2, 2, 4)).toBe(2);
        expect(adjustIndexOnDelete(3, 3, 4)).toBe(2);
    });

    it('keeps activeIndex unchanged when deleted index is after current active', () => {
        expect(adjustIndexOnDelete(1, 2, 4)).toBe(1);
        expect(adjustIndexOnDelete(1, 3, 4)).toBe(1);
    });
});

describe('adjustIndexOnMove', () => {
    it('moves to new position when moving active item', () => {
        expect(adjustIndexOnMove(1, 1, 3)).toBe(3);
        expect(adjustIndexOnMove(2, 2, 0)).toBe(0);
    });

    it('decrements activeIndex when item before active moves to or after active', () => {
        expect(adjustIndexOnMove(2, 0, 2)).toBe(1);
        expect(adjustIndexOnMove(2, 0, 3)).toBe(1);
    });

    it('increments activeIndex when item after active moves to or before active', () => {
        expect(adjustIndexOnMove(1, 3, 0)).toBe(2);
        expect(adjustIndexOnMove(1, 3, 1)).toBe(2);
    });

    it('leaves activeIndex unchanged when move does not cross active index', () => {
        expect(adjustIndexOnMove(2, 0, 1)).toBe(2);
        expect(adjustIndexOnMove(1, 3, 4)).toBe(1);
    });
});

describe('debounce', () => {
    it('debounces function execution', async () => {
        let count = 0;
        const fn = debounce(() => {
            count++;
        }, 50);

        fn();
        fn();
        fn();
        expect(count).toBe(0);

        await new Promise((resolve) => setTimeout(resolve, 80));
        expect(count).toBe(1);
    });

    it('cancels pending invocation', async () => {
        let count = 0;
        const fn = debounce(() => {
            count++;
        }, 50);

        fn();
        fn.cancel();

        await new Promise((resolve) => setTimeout(resolve, 80));
        expect(count).toBe(0);
    });
});
