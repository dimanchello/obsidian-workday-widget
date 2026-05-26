export type Lang = 'ru' | 'en';

function detectLang(): Lang {
    if (typeof document === 'undefined') return 'ru';
    const htmlLang = document.documentElement.lang || '';
    return htmlLang.startsWith('ru') ? 'ru' : 'en';
}

const lang: Lang = detectLang();

const dict: Record<Lang, Record<string, string>> = {
    ru: {
        icon: 'Иконка',
        color: 'Цвет',
        notify: 'Уведомление',
        name: 'Название',
        type: 'Тип',
        range: '⏱ Диапазон',
        countdown: '📅 Обратный отсчёт',
        start: 'Начало',
        end: 'Конец',
        startGroup: 'Старт',
        targetGroup: 'Цель',
        addTimer: '+ Добавить таймер',
        deleteTimer: 'Удалить таймер',
        confirmDelete: 'Удалить таймер "{name}"?',
        myTimer: 'Мой таймер',
        selectIcon: 'Выбрать иконку',
        language: 'Язык',
        noTimers: 'Нет таймеров. Добавь в Настройки → Workday Widget.',
        statPassed: 'Прошло',
        statLeft: 'Осталось',
        statEnd: 'Конец',
        statusBefore: '⏳ Ещё не началось',
        statusDone: '🎉 Завершено!',
        statusRunning: '▶ Идёт',
        statusCountdown: '⏳ Идёт отсчёт',
        statusReached: '🎉 Достигнуто!',
        statusNoRange: '⚠️ Укажи корректный диапазон',
        statusNoTarget: '⚠️ Укажи дату цели',
        statusBadTarget: '⚠️ Некорректная дата цели',
        statusBadStart: '⚠️ Некорректная дата начала',
        timerRangeDefault: 'Диапазонный таймер',
        timerCountdownDefault: 'Обратный отсчёт',
        tabTitleRange: '{name} ({start} – {end})',
        tabTitleCountdown: '{name} → {date}',
        tabTitleRangeNoName: 'Диапазон ({start} – {end})',
        tabTitleCountdownNoName: 'До {date}',
        notificationTitle: '⏱️ Workday Widget',
        notificationBody: 'Таймер "{name}" завершился!',
        notificationBodyNoName: 'Таймер {emoji} завершился!',
        workdayWidget: '⏱️ Workday Widget',
        langLabel: 'Язык / Language',
        iconHint: 'Выберите иконку для таймера',
        colorHint: 'Цвет прогресс-бара',
        notifyHint: 'Уведомление при завершении таймера',
        startGroupHint: 'Дата и время начала',
        targetGroupHint: 'Дата и время цели',
    },
    en: {
        icon: 'Icon',
        color: 'Color',
        notify: 'Notification',
        name: 'Name',
        type: 'Type',
        range: '⏱ Range',
        countdown: '📅 Countdown',
        start: 'Start',
        end: 'End',
        startGroup: 'Start',
        targetGroup: 'Target',
        addTimer: '+ Add timer',
        deleteTimer: 'Delete timer',
        confirmDelete: 'Delete timer "{name}"?',
        myTimer: 'My timer',
        selectIcon: 'Select icon',
        language: 'Language',
        noTimers: 'No timers. Add in Settings → Workday Widget.',
        statPassed: 'Passed',
        statLeft: 'Left',
        statEnd: 'End',
        statusBefore: '⏳ Not started yet',
        statusDone: '🎉 Done!',
        statusRunning: '▶ Running',
        statusCountdown: '⏳ Counting down',
        statusReached: '🎉 Reached!',
        statusNoRange: '⚠️ Set a valid range',
        statusNoTarget: '⚠️ Set a target date',
        statusBadTarget: '⚠️ Invalid target date',
        statusBadStart: '⚠️ Invalid start date',
        timerRangeDefault: 'Range timer',
        timerCountdownDefault: 'Countdown timer',
        tabTitleRange: '{name} ({start} – {end})',
        tabTitleCountdown: '{name} → {date}',
        tabTitleRangeNoName: 'Range ({start} – {end})',
        tabTitleCountdownNoName: 'Until {date}',
        notificationTitle: '⏱️ Workday Widget',
        notificationBody: 'Timer "{name}" completed!',
        notificationBodyNoName: 'Timer {emoji} completed!',
        workdayWidget: '⏱️ Workday Widget',
        langLabel: 'Language',
        iconHint: 'Choose an icon for the timer',
        colorHint: 'Progress bar color',
        notifyHint: 'Notify when timer ends',
        startGroupHint: 'Start date and time',
        targetGroupHint: 'Target date and time',
    },
};

export function t(key: string, ...args: Record<string, string>[]): string {
    const text = dict[lang][key] ?? dict['ru'][key] ?? key;
    if (args.length > 0) {
        const params = args[0];
        return text.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
    }
    return text;
}
