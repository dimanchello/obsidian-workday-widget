import type { Lang } from './i18n';
import { t } from './i18n';

const DAYS_IN_YEAR = 365;
const DAYS_IN_MONTH = 30;
const SECONDS_IN_DAY = 86400;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_MINUTE = 60;

export function uid(): string {
    return Math.random().toString(36).slice(2, 9);
}

export function toMin(t: string): number {
    const parts = (t || '00:00').split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    return h * 60 + m;
}

export function fromMin(m: number): string {
    m = Math.max(0, Math.round(m));
    return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export interface DurationParts {
    y: number;
    m: number;
    d: number;
    h: number;
    min: number;
    s: number;
}

export function calendarDiff(from: Date, to: Date): DurationParts {
    if (to.getTime() <= from.getTime()) {
        return { y: 0, m: 0, d: 0, h: 0, min: 0, s: 0 };
    }

    let y = to.getFullYear() - from.getFullYear();
    const testYearDate = (yearCount: number): Date => {
        const targetYear = from.getFullYear() + yearCount;
        const targetMonth = from.getMonth();
        const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
        const targetDay = Math.min(from.getDate(), maxDays);
        return new Date(
            targetYear,
            targetMonth,
            targetDay,
            from.getHours(),
            from.getMinutes(),
            from.getSeconds(),
            from.getMilliseconds(),
        );
    };

    if (testYearDate(y).getTime() > to.getTime()) {
        y--;
    }
    y = Math.max(0, y);

    let m = 0;
    const testMonthDate = (monthCount: number): Date => {
        const totalMonths = from.getMonth() + monthCount;
        const targetYear = from.getFullYear() + y + Math.floor(totalMonths / 12);
        const targetMonth = ((totalMonths % 12) + 12) % 12;
        const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
        const targetDay = Math.min(from.getDate(), maxDays);
        return new Date(
            targetYear,
            targetMonth,
            targetDay,
            from.getHours(),
            from.getMinutes(),
            from.getSeconds(),
            from.getMilliseconds(),
        );
    };

    while (m < 12) {
        if (testMonthDate(m + 1).getTime() <= to.getTime()) {
            m++;
        } else {
            break;
        }
    }

    const baseDate = testMonthDate(m);
    const remMs = Math.max(0, to.getTime() - baseDate.getTime());
    const remSec = Math.round(remMs / 1000);

    const s = remSec % SECONDS_IN_MINUTE;
    const totalMin = Math.floor(remSec / SECONDS_IN_MINUTE);
    const min = totalMin % 60;
    const totalHours = Math.floor(totalMin / 60);
    const h = totalHours % 24;
    const d = Math.floor(totalHours / 24);

    return { y, m, d, h, min, s };
}

export function secondsDiff(totalSec: number): DurationParts {
    totalSec = Math.max(0, Math.round(totalSec));
    const totalDays = Math.floor(totalSec / SECONDS_IN_DAY);
    const y = Math.floor(totalDays / DAYS_IN_YEAR);
    const remDays = totalDays % DAYS_IN_YEAR;
    const m = Math.min(11, Math.floor(remDays / DAYS_IN_MONTH));
    const d = remDays - m * DAYS_IN_MONTH;
    const h = Math.floor((totalSec % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const min = Math.floor((totalSec % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    const s = totalSec % SECONDS_IN_MINUTE;
    return { y, m, d, h, min, s };
}

export function formatDurationParts(parts: DurationParts, lang?: Lang): string {
    const { y, m, d, h, min, s } = parts;
    const yUnit = t('unitYear', undefined, lang);
    const moUnit = t('unitMonth', undefined, lang);
    const dUnit = t('unitDay', undefined, lang);
    const hUnit = t('unitHour', undefined, lang);
    const mUnit = t('unitMinute', undefined, lang);
    const sUnit = t('unitSecond', undefined, lang);

    let windowUnits: { val: number; unit: string }[];

    if (y > 0) {
        windowUnits = [
            { val: y, unit: yUnit },
            { val: m, unit: moUnit },
            { val: d, unit: dUnit },
        ];
    } else if (m > 0) {
        windowUnits = [
            { val: m, unit: moUnit },
            { val: d, unit: dUnit },
            { val: h, unit: hUnit },
        ];
    } else if (d > 0) {
        windowUnits = [
            { val: d, unit: dUnit },
            { val: h, unit: hUnit },
            { val: min, unit: mUnit },
        ];
    } else if (h > 0) {
        windowUnits = [
            { val: h, unit: hUnit },
            { val: min, unit: mUnit },
            { val: s, unit: sUnit },
        ];
    } else if (min > 0) {
        windowUnits = [
            { val: min, unit: mUnit },
            { val: s, unit: sUnit },
        ];
    } else {
        windowUnits = [{ val: s, unit: sUnit }];
    }

    const nonZero = windowUnits.filter((item) => item.val > 0);
    if (nonZero.length === 0) {
        return `0 ${sUnit}`;
    }

    return nonZero.map((item) => `${item.val} ${item.unit}`).join(' ');
}

export function durStr(totalSec: number, lang?: Lang): string;
export function durStr(from: Date, to: Date, lang?: Lang): string;
export function durStr(arg1: number | Date, arg2?: Date | Lang, arg3?: Lang): string {
    if (arg1 instanceof Date) {
        const from = arg1;
        const to = arg2 instanceof Date ? arg2 : arg1;
        const lang = arg3;
        if (!isValidDate(from) || !isValidDate(to) || to.getTime() <= from.getTime()) {
            return `0 ${t('unitSecond', undefined, lang)}`;
        }
        return formatDurationParts(calendarDiff(from, to), lang);
    }

    const totalSec = typeof arg1 === 'number' ? arg1 : 0;
    const lang = typeof arg2 === 'string' ? arg2 : undefined;
    return formatDurationParts(secondsDiff(totalSec), lang);
}

export function durStrShort(min: number, lang?: Lang): string {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60);
    const mm = min % 60;
    const hUnit = t('unitHour', undefined, lang);
    const mUnit = t('unitMinute', undefined, lang);

    if (h === 0) return `${mm}${mUnit}`;
    if (mm === 0) return `${h}${hUnit}`;
    return `${h}${hUnit} ${mm}${mUnit}`;
}

export function todayStr(): string {
    const d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
}

export function isValidDate(d: Date): boolean {
    return d instanceof Date && !isNaN(d.getTime());
}

export function parseDatetime(dtStr: string): Date | null {
    if (!dtStr || typeof dtStr !== 'string') return null;
    const trimmed = dtStr.trim();
    if (!trimmed) return null;
    const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
    const date = new Date(normalized);
    return isValidDate(date) ? date : null;
}

export function adjustIndexOnDelete(
    currentIndex: number,
    deletedIndex: number,
    totalCount: number,
): number {
    if (totalCount <= 1) return 0;
    if (deletedIndex < currentIndex) {
        return Math.max(0, currentIndex - 1);
    }
    if (deletedIndex === currentIndex) {
        return Math.min(currentIndex, Math.max(0, totalCount - 2));
    }
    return currentIndex;
}

export function adjustIndexOnMove(currentIndex: number, from: number, to: number): number {
    if (currentIndex === from) {
        return to;
    }
    if (from < currentIndex && to >= currentIndex) {
        return currentIndex - 1;
    }
    if (from > currentIndex && to <= currentIndex) {
        return currentIndex + 1;
    }
    return currentIndex;
}

export function debounce<Args extends unknown[], Return>(
    fn: (...args: Args) => Return,
    waitMs: number,
): ((...args: Args) => void) & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Args): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            void fn(...args);
            timeoutId = null;
        }, waitMs);
    };
    debounced.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
    return debounced;
}
