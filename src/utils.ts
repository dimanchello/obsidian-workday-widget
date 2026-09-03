import type { Lang } from './i18n';
import { t } from './i18n';

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

export function durStr(totalSec: number, lang?: Lang): string {
    totalSec = Math.max(0, Math.round(totalSec));
    const d = Math.floor(totalSec / SECONDS_IN_DAY);
    const h = Math.floor((totalSec % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const m = Math.floor((totalSec % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    const s = totalSec % SECONDS_IN_MINUTE;
    const dUnit = t('unitDay', undefined, lang);
    const hUnit = t('unitHour', undefined, lang);
    const mUnit = t('unitMinute', undefined, lang);
    const sUnit = t('unitSecond', undefined, lang);

    if (d > 0) return `${d}${dUnit} ${h}${hUnit} ${m}${mUnit}`;
    if (h > 0) return `${h}${hUnit} ${m}${mUnit}`;
    if (m > 0) return `${m}${mUnit} ${s}${sUnit}`;
    return `${s}${sUnit}`;
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
