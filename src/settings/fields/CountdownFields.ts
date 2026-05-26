import { TimerConfig } from '../../types';
import { todayStr } from '../../utils';
import { t } from '../../i18n';

export function renderCountdownFields(
    card: HTMLElement,
    timer: TimerConfig,
    onSave: () => Promise<void>,
): void {
    const isNew = !timer.startDatetime && !timer.targetDatetime;
    if (isNew) {
        timer.startDatetime = `${todayStr()}T09:00`;
        void onSave();
    }

    const row = card.createDiv({ cls: 'wd-form-row-2' });

    // Start group
    const startGroup = row.createDiv({ cls: 'wd-form-field' });
    startGroup.createEl('label', {
        cls: 'wd-form-label',
        text: t('startGroup'),
        attr: { title: t('startGroupHint') },
    });
    const startInput = startGroup.createEl('input', {
        cls: 'wd-form-datetime',
        attr: { type: 'datetime-local' },
    });
    startInput.value = timer.startDatetime;
    startInput.addEventListener('change', async () => {
        timer.startDatetime = startInput.value;
        await onSave();
    });

    // Target group
    const targetGroup = row.createDiv({ cls: 'wd-form-field' });
    targetGroup.createEl('label', {
        cls: 'wd-form-label',
        text: t('targetGroup'),
        attr: { title: t('targetGroupHint') },
    });
    const targetInput = targetGroup.createEl('input', {
        cls: 'wd-form-datetime',
        attr: { type: 'datetime-local' },
    });
    targetInput.value = timer.targetDatetime;
    targetInput.addEventListener('change', async () => {
        timer.targetDatetime = targetInput.value;
        await onSave();
    });
}
