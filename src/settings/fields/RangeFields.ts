import type { TimerConfig } from '../../types';
import { t } from '../../i18n';

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
    startInput.addEventListener('input', async () => {
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
    endInput.addEventListener('input', async () => {
        timer.endTime = endInput.value;
        await onSave();
    });
}
