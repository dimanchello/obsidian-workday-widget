import type { CountdownStatus, RangeStatus, TimerConfig } from './types';
import { TimerStrategyFactory } from './strategies/TimerStrategyFactory';
import type {
    CountdownCalculationResult,
    RangeCalculationResult,
} from './strategies/TimerStrategy';

export type { RangeStatus, CountdownStatus };

export type RangeTickResult = RangeCalculationResult;
export type CountdownTickResult = CountdownCalculationResult;

export function calcRange(timer: TimerConfig, now: Date): RangeTickResult {
    return TimerStrategyFactory.getStrategy('range').calculate(timer, now) as RangeTickResult;
}

export function calcCountdown(timer: TimerConfig, now: Date): CountdownTickResult {
    return TimerStrategyFactory.getStrategy('countdown').calculate(
        timer,
        now,
    ) as CountdownTickResult;
}
