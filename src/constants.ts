import { PluginSettings, TimerConfig } from './types';

export const VIEW_TYPE = 'workday-widget-v2';

export const EMOJIS: string[] = [
    '💼','🏖️','🏠','🎯','📚','🚀','💪','🎨','🎮','🏃',
    '🧘','🍕','☕','🎵','✈️','🏋️','🌿','🔥','⭐','🎉',
    '🕐','📅','🏆','💡','🛠️','🎸','🌙','🌅','🦁','🐢',
];

export const DEFAULT_TIMER: TimerConfig = {
    id:          '',
    emoji:       '💼',
    name:        '',
    type:        'range',
    color:       '#7c6af7',
    notify:      false,
    startTime:   '09:00',
    endTime:     '18:00',
    targetDate:  '',
    targetTime:  '18:00',
    startDate:   '',
    startTimeC:  '09:00',
};

export const DEFAULT_SETTINGS: PluginSettings = {
    timers: [{
        ...DEFAULT_TIMER,
        id:    'default',
        emoji: '💼',
        name:  'Рабочий день',
    }],
    activeIndex: 0,
};
