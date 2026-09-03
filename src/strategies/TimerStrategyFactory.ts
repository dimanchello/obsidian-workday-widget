import type { TimerType } from '../types';
import type { TimerStrategy } from './TimerStrategy';
import { RangeTimerStrategy } from './RangeTimerStrategy';
import { CountdownTimerStrategy } from './CountdownTimerStrategy';

export class TimerStrategyFactory {
    private static strategies: Record<TimerType, TimerStrategy> = {
        range: new RangeTimerStrategy(),
        countdown: new CountdownTimerStrategy(),
    };

    static getStrategy(type: TimerType): TimerStrategy {
        return this.strategies[type] ?? this.strategies.range;
    }
}
