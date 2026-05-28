import type { TimerConfig } from './types';
import { toMin, isValidDate } from './utils';

export type RangeStatus = 'invalid' | 'before' | 'running' | 'done';

export interface RangeTickResult {
    status: RangeStatus;
    startM: number;
    endM: number;
    totalM: number;
    pct: number;
    passedM: number;
    leftM: number;
}

export function calcRange(timer: TimerConfig, now: Date): RangeTickResult {
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const startM = toMin(timer.startTime);
    const endM = toMin(timer.endTime);
    const totalM = endM > startM ? endM - startM : 0;

    if (totalM <= 0) {
        return {
            status: 'invalid',
            startM,
            endM,
            totalM: 0,
            pct: 0,
            passedM: 0,
            leftM: 0,
        };
    }

    if (nowMin < startM) {
        return {
            status: 'before',
            startM,
            endM,
            totalM,
            pct: 0,
            passedM: 0,
            leftM: startM - nowMin,
        };
    }

    if (nowMin >= endM) {
        return {
            status: 'done',
            startM,
            endM,
            totalM,
            pct: 100,
            passedM: totalM,
            leftM: 0,
        };
    }

    const elapsed = nowMin - startM;
    return {
        status: 'running',
        startM,
        endM,
        totalM,
        pct: Math.min((elapsed / totalM) * 100, 100),
        passedM: elapsed,
        leftM: Math.max(0, totalM - elapsed),
    };
}

export type CountdownStatus = 'no-target' | 'bad-target' | 'bad-start' | 'running' | 'done';

export interface CountdownTickResult {
    status: CountdownStatus;
    leftSec: number;
    totalSec: number | null;
    passedSec: number | null;
    pct: number;
    isDone: boolean;
    hasStart: boolean;
    targetDate: Date | null;
    startDate: Date | null;
}

export function calcCountdown(timer: TimerConfig, now: Date): CountdownTickResult {
    if (!timer.targetDatetime) {
        return {
            status: 'no-target',
            leftSec: 0,
            totalSec: null,
            passedSec: null,
            pct: 0,
            isDone: false,
            hasStart: !!timer.startDatetime,
            targetDate: null,
            startDate: null,
        };
    }

    const target = new Date(timer.targetDatetime + ':00');
    if (!isValidDate(target)) {
        return {
            status: 'bad-target',
            leftSec: 0,
            totalSec: null,
            passedSec: null,
            pct: 0,
            isDone: false,
            hasStart: !!timer.startDatetime,
            targetDate: null,
            startDate: null,
        };
    }

    const hasStart = !!timer.startDatetime;
    const start = hasStart ? new Date(timer.startDatetime + ':00') : null;

    if (start && !isValidDate(start)) {
        return {
            status: 'bad-start',
            leftSec: 0,
            totalSec: null,
            passedSec: null,
            pct: 0,
            isDone: false,
            hasStart,
            targetDate: null,
            startDate: null,
        };
    }

    const leftToEndSec = Math.max(0, (target.getTime() - now.getTime()) / 1000);
    const totalSec = start ? Math.max(0, (target.getTime() - start.getTime()) / 1000) : null;
    const passedSec = totalSec !== null ? Math.max(0, totalSec - leftToEndSec) : null;
    const leftSec =
        start && now < start ? Math.max(0, (start.getTime() - now.getTime()) / 1000) : leftToEndSec;
    const pct =
        totalSec !== null && totalSec > 0 && passedSec !== null
            ? Math.min((passedSec / totalSec) * 100, 100)
            : leftToEndSec <= 0
              ? 100
              : 0;
    const isDone = leftToEndSec <= 0;

    return {
        status: isDone ? 'done' : 'running',
        leftSec,
        totalSec,
        passedSec,
        pct,
        isDone,
        hasStart,
        targetDate: target,
        startDate: start,
    };
}
