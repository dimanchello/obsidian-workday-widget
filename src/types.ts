export type TimerType = 'range' | 'countdown';

export interface TimerConfig {
    id:          string;
    emoji:       string;
    name:        string;
    type:        TimerType;
    color:       string;
    notify:      boolean;
    // range
    startTime:   string;
    endTime:     string;
    // countdown
    targetDate:  string;
    targetTime:  string;
    startDate:   string;
    startTimeC:  string;
}

export interface PluginSettings {
    timers:      TimerConfig[];
    activeIndex: number;
}

// DOM-ссылки на элементы одной панели таймера
export interface PanelElements {
    titleEl:    HTMLElement;
    clockEl:    HTMLElement;
    lblStart:   HTMLElement;
    lblPct:     HTMLElement;
    lblEnd:     HTMLElement;
    barEl:      HTMLElement;
    passedEl:   HTMLElement;
    leftEl:     HTMLElement;
    endEl?:     HTMLElement;   // только range
    statusEl:   HTMLElement;
    deleteBtn?: HTMLElement;   // только countdown
}

export interface Panel {
    wrap: HTMLElement;
    els:  PanelElements;
}
