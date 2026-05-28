import type { App } from 'obsidian';

export type TimerType = 'range' | 'countdown';

export interface TimerConfig {
    id: string;
    emoji: string;
    name: string;
    type: TimerType;
    color: string;
    notifyStart: boolean;
    notifyEnd: boolean;
    notifiedStart: boolean;
    notifiedEnd: boolean;
    // range
    startTime: string;
    endTime: string;
    // countdown
    targetDatetime: string; // YYYY-MM-DDTHH:mm (datetime-local)
    startDatetime: string; // YYYY-MM-DDTHH:mm (datetime-local)
}

export type DisplayMode = 'tabs' | 'list';

export interface PluginBridge {
    settings: PluginSettings;
    saveSettings(): Promise<void>;
    refreshView(): void;
    app: App;
}

export interface PluginSettings {
    timers: TimerConfig[];
    activeIndex: number;
    displayMode: DisplayMode;
}

// DOM-ссылки на элементы одной панели таймера
export interface PanelElements {
    titleEl: HTMLElement;
    clockEl: HTMLElement;
    lblStart: HTMLElement;
    lblPct: HTMLElement;
    lblEnd: HTMLElement;
    barEl: HTMLElement;
    passedEl: HTMLElement;
    leftEl: HTMLElement;
    endEl?: HTMLElement; // только range
    statusEl: HTMLElement;
    deleteBtn?: HTMLElement; // только countdown
}

export interface Panel {
    wrap: HTMLElement;
    els: PanelElements;
}
