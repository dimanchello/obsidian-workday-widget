import type { CountdownStatus, PanelElements, RangeStatus, TimerConfig, TimerType } from '../types';

export interface RangeCalculationResult {
    type: 'range';
    status: RangeStatus;
    startM: number;
    endM: number;
    totalM: number;
    pct: number;
    passedM: number;
    leftM: number;
}

export interface CountdownCalculationResult {
    type: 'countdown';
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

export type TimerCalculationResult = RangeCalculationResult | CountdownCalculationResult;

export interface TimerStrategy {
    readonly type: TimerType;
    calculate(timer: TimerConfig, now: Date): TimerCalculationResult;
    renderStats(
        parent: HTMLElement,
        mkStat: (parent: HTMLElement, label: string, color: string) => HTMLElement,
    ): {
        passedEl: HTMLElement;
        leftEl: HTMLElement;
        endEl?: HTMLElement;
    };
    updateUI(timer: TimerConfig, result: TimerCalculationResult, els: PanelElements): void;
}
