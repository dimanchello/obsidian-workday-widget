import { DEFAULT_DAYS_OF_WEEK } from './constants';
import type { TimerConfig } from './types';
import { fromMin, toMin } from './utils';

export function migrateSettings(timers: TimerConfig[]): void {
    for (const t of timers) {
        if ((t as { type: string }).type === 'workday') {
            const legacy = t as TimerConfig & { workHours?: number; lunchMin?: number };
            t.type = 'range';
            t.endTime = fromMin(
                toMin(t.startTime) + (legacy.workHours ?? 8) * 60 + (legacy.lunchMin ?? 0),
            );
        }
        if (t.type === 'range' && (!t.daysOfWeek || !Array.isArray(t.daysOfWeek))) {
            t.daysOfWeek = [...DEFAULT_DAYS_OF_WEEK];
        }
    }
}
