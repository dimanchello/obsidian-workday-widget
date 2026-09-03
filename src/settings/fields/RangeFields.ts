import type { TimerConfig } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';
import { t } from '../../i18n';
import { renderNotificationFields } from './NotificationFields';

export function renderRangeFields(
    card: HTMLElement,
    timer: TimerConfig,
    onSave: () => Promise<void>,
): void {
    const row = card.createDiv({ cls: 'wd-form-row-2' });

    const startField = row.createDiv({ cls: 'wd-form-field' });
    startField.createEl('label', { cls: 'wd-form-label', text: t('start') });
    const startInput = startField.createEl('input', {
        cls: 'wd-form-time',
        attr: { type: 'time' },
    });
    startInput.value = timer.startTime || '09:00';
    startInput.addEventListener('change', async () => {
        timer.startTime = startInput.value;
        await onSave();
    });

    const endField = row.createDiv({ cls: 'wd-form-field' });
    endField.createEl('label', { cls: 'wd-form-label', text: t('end') });
    const endInput = endField.createEl('input', {
        cls: 'wd-form-time',
        attr: { type: 'time' },
    });
    endInput.value = timer.endTime || '18:00';
    endInput.addEventListener('change', async () => {
        timer.endTime = endInput.value;
        await onSave();
    });

    // Days of week selector
    const daysContainer = card.createDiv({ cls: 'wd-days-container' });
    const daysHeader = daysContainer.createDiv({ cls: 'wd-days-header' });
    daysHeader.createEl('label', {
        cls: 'wd-form-label',
        text: t('daysOfWeek'),
        attr: { title: t('daysOfWeekHint') },
    });

    const presetsWrap = daysHeader.createDiv({ cls: 'wd-days-presets' });
    const weekdaysBtn = presetsWrap.createEl('button', {
        cls: 'wd-preset-btn',
        text: t('weekdaysPreset'),
        attr: { type: 'button' },
    });
    weekdaysBtn.addEventListener('click', async () => {
        timer.daysOfWeek = [1, 2, 3, 4, 5];
        updateChipStates();
        await onSave();
    });

    const allDaysBtn = presetsWrap.createEl('button', {
        cls: 'wd-preset-btn',
        text: t('allDaysPreset'),
        attr: { type: 'button' },
    });
    allDaysBtn.addEventListener('click', async () => {
        timer.daysOfWeek = [1, 2, 3, 4, 5, 6, 0];
        updateChipStates();
        await onSave();
    });

    const chipsRow = daysContainer.createDiv({ cls: 'wd-days-chips' });
    const chipElements: { btn: HTMLElement; day: number }[] = [];

    const activeDays = timer.daysOfWeek ?? [1, 2, 3, 4, 5];
    timer.daysOfWeek = activeDays;

    DAYS_OF_WEEK.forEach((d) => {
        const chip = chipsRow.createEl('button', {
            cls: 'wd-day-chip',
            text: t(d.labelKey),
            attr: { type: 'button' },
        });
        chipElements.push({ btn: chip, day: d.day });

        chip.addEventListener('click', async () => {
            const current = timer.daysOfWeek ?? [];
            if (current.includes(d.day)) {
                timer.daysOfWeek = current.filter((x) => x !== d.day);
            } else {
                timer.daysOfWeek = [...current, d.day];
            }
            updateChipStates();
            await onSave();
        });
    });

    function updateChipStates(): void {
        const current = timer.daysOfWeek ?? [];
        for (const item of chipElements) {
            item.btn.toggleClass('active', current.includes(item.day));
        }
    }

    updateChipStates();

    // Notifications
    renderNotificationFields(card, timer, onSave);
}
