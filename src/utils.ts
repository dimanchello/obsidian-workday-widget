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
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (d > 0) return `${d}д ${h}ч ${m}м`;
    if (h > 0) return `${h}ч ${m}м`;
    if (m > 0) return `${m}м ${s}с`;
    return `${s}с`;
}

export function durStrShort(min: number): string {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60);
    const mm = min % 60;
    if (h === 0) return `${mm}м`;
    if (mm === 0) return `${h}ч`;
    return `${h}ч ${mm}м`;
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
