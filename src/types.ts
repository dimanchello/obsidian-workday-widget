export type TimerType = 'range' | 'countdown';

export interface TimerConfig {
    id: string;
    emoji: string;
    name: string;
    type: TimerType;
    color: string;
    notify: boolean;
    notified: boolean; // persist across restarts
    // range
    startTime: string;
    endTime: string;
    // countdown
    targetDatetime: string; // YYYY-MM-DDTHH:mm (datetime-local)
    startDatetime: string; // YYYY-MM-DDTHH:mm (datetime-local)
}

export interface PluginSettings {
    timers: TimerConfig[];
    activeIndex: number;
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
