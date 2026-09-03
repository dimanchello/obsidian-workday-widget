import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { App, Plugin } from 'obsidian';
import type { TimerConfig } from './types';
import WorkdayPlugin from './main';
import { TimerEngine } from './services/TimerEngine';
import { adjustIndexOnDelete, adjustIndexOnMove } from './utils';

const noticeMock = vi.fn();
vi.mock('obsidian', () => {
    return {
        Plugin: class {
            app: App;
            manifest: Record<string, unknown> = {};
            constructor(app: App) {
                this.app = app;
            }
            registerView = vi.fn();
            addSettingTab = vi.fn();
            addRibbonIcon = vi.fn();
            loadData = vi.fn().mockResolvedValue({});
            saveData = vi.fn().mockResolvedValue(undefined);
        },
        Notice: class {
            constructor(msg: string, timeout: number) {
                noticeMock(msg, timeout);
            }
        },
        ItemView: class {
            containerEl = {
                children: [
                    {},
                    {
                        empty: vi.fn(),
                        addClass: vi.fn(),
                        createDiv: vi.fn().mockReturnValue({
                            style: {},
                            createDiv: vi.fn(),
                            createSpan: vi.fn(),
                            createEl: vi.fn(),
                            querySelectorAll: vi.fn().mockReturnValue([]),
                            empty: vi.fn(),
                        }),
                        createEl: vi.fn(),
                    },
                ],
            };
        },
        PluginSettingTab: class {
            app: App;
            plugin: Plugin;
            constructor(app: App, plugin: Plugin) {
                this.app = app;
                this.plugin = plugin;
            }
        },
        Modal: class {
            app: App;
            contentEl = {
                empty: vi.fn(),
                createEl: vi.fn().mockReturnValue({ style: {}, addEventListener: vi.fn() }),
                createDiv: vi.fn().mockReturnValue({
                    style: {},
                    createEl: vi.fn().mockReturnValue({ style: {}, addEventListener: vi.fn() }),
                }),
            };
            constructor(app: App) {
                this.app = app;
            }
            open = vi.fn();
            close = vi.fn();
        },
    };
});

describe('Integration: WorkdayPlugin Lifecycle & Settings', () => {
    let appMock: App;
    let plugin: WorkdayPlugin;

    beforeEach(() => {
        vi.clearAllMocks();
        appMock = {
            workspace: {
                getLeavesOfType: vi.fn().mockReturnValue([]),
                detachLeavesOfType: vi.fn(),
                revealLeaf: vi.fn(),
                getRightLeaf: vi.fn(),
            },
        } as unknown as App;

        plugin = new WorkdayPlugin(appMock, {} as unknown as Plugin['manifest']);
    });

    it('loads settings and applies deep merge for missing fields on existing timers', async () => {
        plugin.loadData = vi.fn().mockResolvedValue({
            timers: [
                {
                    id: 'custom-1',
                    name: 'Custom shift',
                    startTime: '10:00',
                    endTime: '19:00',
                    // missing color, type, notifyStart, etc.
                },
            ],
            activeIndex: 0,
            displayMode: 'tabs',
        });

        await plugin.onload();

        expect(plugin.settings.timers).toHaveLength(1);
        const timer = plugin.settings.timers[0];
        expect(timer.name).toBe('Custom shift');
        expect(timer.startTime).toBe('10:00');
        expect(timer.type).toBe('range');
        expect(timer.color).toBe('#7c6af7');
        expect(timer.notifyStart).toBe(false);
        expect(timer.notifiedStart).toBe(false);

        await plugin.onunload();
    });

    it('migrates legacy workday timer format to range upon loading', async () => {
        plugin.loadData = vi.fn().mockResolvedValue({
            timers: [
                {
                    id: 'old-workday',
                    name: 'Old style',
                    type: 'workday',
                    startTime: '08:00',
                    workHours: 9,
                    lunchMin: 30,
                },
            ],
        });

        await plugin.loadSettings();

        expect(plugin.settings.timers[0].type).toBe('range');
        expect(plugin.settings.timers[0].startTime).toBe('08:00');
        expect(plugin.settings.timers[0].endTime).toBe('17:30');
    });

    it('preserves activeIndex consistency when removing timers', () => {
        let activeIndex = 2;
        const total = 3;

        activeIndex = adjustIndexOnDelete(activeIndex, 0, total);
        expect(activeIndex).toBe(1);

        activeIndex = adjustIndexOnDelete(activeIndex, 1, total - 1);
        expect(activeIndex).toBe(0);
    });

    it('preserves activeIndex consistency when moving timers', () => {
        let activeIndex = 1;
        activeIndex = adjustIndexOnMove(activeIndex, 2, 0);
        expect(activeIndex).toBe(2);
    });
});

describe('Integration: TimerEngine & Notifications', () => {
    let pluginMock: WorkdayPlugin;
    let engine: TimerEngine;

    beforeEach(() => {
        vi.clearAllMocks();
        const notificationClass = class {
            static permission = 'granted';
            static requestPermission = vi.fn().mockResolvedValue('granted');
        };

        Object.defineProperty(globalThis, 'Notification', {
            value: notificationClass,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, 'window', {
            value: { Notification: notificationClass },
            writable: true,
            configurable: true,
        });

        const initialTimer: TimerConfig = {
            id: 't1',
            emoji: '💼',
            name: 'Shift',
            type: 'range',
            color: '#7c6af7',
            notifyStart: true,
            notifyEnd: true,
            notifiedStart: false,
            notifiedEnd: false,
            startTime: '09:00',
            endTime: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5],
            targetDatetime: '',
            startDatetime: '',
        };

        pluginMock = {
            settings: {
                timers: [initialTimer],
                activeIndex: 0,
                displayMode: 'tabs',
            },
            saveSettings: vi.fn().mockResolvedValue(undefined),
            refreshView: vi.fn(),
            app: {} as unknown as App,
        } as unknown as WorkdayPlugin;

        engine = new TimerEngine(pluginMock);
    });

    afterEach(() => {
        engine.stop();
        vi.restoreAllMocks();
    });

    it('notifies subscribers on each tick', () => {
        const listener = vi.fn();
        const unsubscribe = engine.subscribe(listener);

        const testTime = new Date(2026, 5, 1, 10, 0, 0);
        engine.tick(testTime);

        expect(listener).toHaveBeenCalledWith(testTime);

        unsubscribe();
        engine.tick(testTime);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('triggers start notification only once when transition into running occurs', () => {
        const timer = pluginMock.settings.timers[0];

        // Before start: 08:00
        engine.tick(new Date(2026, 5, 1, 8, 0, 0));
        expect(noticeMock).not.toHaveBeenCalled();
        expect(timer.notifiedStart).toBe(false);

        // Transition to running: 09:05
        engine.tick(new Date(2026, 5, 1, 9, 5, 0));
        expect(noticeMock).toHaveBeenCalledTimes(1);
        expect(timer.notifiedStart).toBe(true);

        // Next tick while still running: 09:06 - no duplicate notification!
        engine.tick(new Date(2026, 5, 1, 9, 6, 0));
        expect(noticeMock).toHaveBeenCalledTimes(1);
    });

    it('triggers end notification only once when transition into done occurs', () => {
        const timer = pluginMock.settings.timers[0];
        timer.notifiedStart = true;

        // Transition to done: 18:01
        engine.tick(new Date(2026, 5, 1, 18, 1, 0));
        expect(noticeMock).toHaveBeenCalledTimes(1);
        expect(timer.notifiedEnd).toBe(true);

        // Subsequent ticks after done - no duplicate notification!
        engine.tick(new Date(2026, 5, 1, 18, 2, 0));
        expect(noticeMock).toHaveBeenCalledTimes(1);
    });

    it('does not trigger notifications on inactive days of the week', () => {
        const timer = pluginMock.settings.timers[0];

        // 2026-06-06 is Saturday (inactive for [1, 2, 3, 4, 5])
        engine.tick(new Date(2026, 5, 6, 12, 0, 0));
        expect(noticeMock).not.toHaveBeenCalled();
        expect(timer.notifiedStart).toBe(false);
        expect(timer.notifiedEnd).toBe(false);
    });
});
