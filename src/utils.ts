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

export function durStr(totalSec: number): string {
    totalSec = Math.max(0, Math.round(totalSec));
    const d = Math.floor(totalSec / SECONDS_IN_DAY);
    const h = Math.floor((totalSec % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const m = Math.floor((totalSec % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    const s = totalSec % SECONDS_IN_MINUTE;
    if (d > 0) return `${d}${t('timeD')} ${h}${t('timeH')} ${m}${t('timeM')}`;
    if (h > 0) return `${h}${t('timeH')} ${m}${t('timeM')}`;
    if (m > 0) return `${m}${t('timeM')} ${s}${t('timeS')}`;
    return `${s}${t('timeS')}`;
}

export function durStrShort(min: number): string {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60);
    const mm = min % 60;
    if (h === 0) return `${mm}${t('timeM')}`;
    if (mm === 0) return `${h}${t('timeH')}`;
    return `${h}${t('timeH')} ${mm}${t('timeM')}`;
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
