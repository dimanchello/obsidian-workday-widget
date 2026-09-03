import type { ITimerEngine, PluginBridge, TimerConfig } from '../types';
import { calcCountdown, calcRange } from '../timerLogic';
import { sendNotification } from '../notifications';
import { todayStr } from '../utils';

export class TimerEngine implements ITimerEngine {
    private plugin: PluginBridge;
    private intervalId: number | null = null;
    private listeners = new Set<(now: Date) => void>();
    private lastDay: string = todayStr();

    constructor(plugin: PluginBridge) {
        this.plugin = plugin;
    }

    start(): void {
        if (this.intervalId !== null) return;
        this.tick();
        if (typeof window !== 'undefined') {
            this.intervalId = window.setInterval(() => this.tick(), 1000);
        } else {
            this.intervalId = setInterval(() => this.tick(), 1000) as unknown as number;
        }
    }

    stop(): void {
        if (this.intervalId !== null) {
            if (typeof window !== 'undefined') {
                window.clearInterval(this.intervalId);
            } else {
                clearInterval(this.intervalId);
            }
            this.intervalId = null;
        }
    }

    subscribe(listener: (now: Date) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    tick(now: Date = new Date()): void {
        this.checkMidnightRollover();
        this.checkNotifications(now);

        for (const listener of this.listeners) {
            listener(now);
        }
    }

    private checkMidnightRollover(): void {
        const currentDay = todayStr();
        if (currentDay === this.lastDay) return;

        this.lastDay = currentDay;
        let changed = false;

        for (const timer of this.plugin.settings.timers) {
            if (timer.type === 'range') {
                if (timer.notifiedStart || timer.notifiedEnd) {
                    timer.notifiedStart = false;
                    timer.notifiedEnd = false;
                    changed = true;
                }
            }
        }

        if (changed) {
            void this.plugin.saveSettings();
        }
    }

    private checkNotifications(now: Date): void {
        const { timers } = this.plugin.settings;
        if (!timers) return;

        for (const timer of timers) {
            if (timer.type === 'range') {
                this.checkRangeNotification(timer, now);
            } else {
                this.checkCountdownNotification(timer, now);
            }
        }
    }

    private checkRangeNotification(timer: TimerConfig, now: Date): void {
        const r = calcRange(timer, now);

        if (r.status === 'off') {
            if (timer.notifiedStart || timer.notifiedEnd) {
                timer.notifiedStart = false;
                timer.notifiedEnd = false;
                void this.plugin.saveSettings();
            }
            return;
        }

        if (r.status === 'before') {
            if (timer.notifiedStart || timer.notifiedEnd) {
                timer.notifiedStart = false;
                timer.notifiedEnd = false;
                void this.plugin.saveSettings();
            }
            return;
        }

        if (r.status === 'done') {
            if (timer.notifyEnd && !timer.notifiedEnd) {
                timer.notifiedEnd = true;
                void this.plugin.saveSettings();
                sendNotification(timer, 'end');
            }
            return;
        }

        if (r.status === 'running') {
            if (timer.notifiedEnd) {
                timer.notifiedEnd = false;
                void this.plugin.saveSettings();
            }
            if (timer.notifyStart && !timer.notifiedStart) {
                timer.notifiedStart = true;
                void this.plugin.saveSettings();
                sendNotification(timer, 'start');
            }
        }
    }

    private checkCountdownNotification(timer: TimerConfig, now: Date): void {
        const r = calcCountdown(timer, now);

        if (r.status === 'before') {
            if (timer.notifiedStart) {
                timer.notifiedStart = false;
                void this.plugin.saveSettings();
            }
            return;
        }

        if (r.isDone) {
            if (timer.notifyEnd && !timer.notifiedEnd) {
                timer.notifiedEnd = true;
                void this.plugin.saveSettings();
                sendNotification(timer, 'end');
            }
            return;
        }

        if (r.status === 'running') {
            if (timer.notifiedEnd) {
                timer.notifiedEnd = false;
                void this.plugin.saveSettings();
            }
            if (r.startDate && now >= r.startDate) {
                if (timer.notifyStart && !timer.notifiedStart) {
                    timer.notifiedStart = true;
                    void this.plugin.saveSettings();
                    sendNotification(timer, 'start');
                }
            }
        }
    }
}
