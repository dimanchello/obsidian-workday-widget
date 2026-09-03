import type { TimerConfig } from '../../types';
import { t } from '../../i18n';

export function renderNotificationFields(
    container: HTMLElement,
    timer: TimerConfig,
    onSave: () => Promise<void>,
): void {
    const group = container.createDiv({ cls: 'wd-notifications-group' });
    group.createDiv({
        cls: 'wd-notifications-title',
        text: t('notifications'),
    });

    // Start notification toggle
    const startRow = group.createDiv({ cls: 'wd-toggle-row' });
    const startLabelWrap = startRow.createDiv({ cls: 'wd-toggle-label-wrap' });
    startLabelWrap.createSpan({
        cls: 'wd-toggle-label',
        text: t('notifyStart'),
    });
    startLabelWrap.createSpan({
        cls: 'wd-toggle-desc',
        text: t('notifyStartDesc'),
    });

    const startToggle = startRow.createDiv({ cls: 'checkbox-container' });
    if (timer.notifyStart) startToggle.addClass('is-enabled');
    startToggle.addEventListener('click', async () => {
        timer.notifyStart = !startToggle.hasClass('is-enabled');
        startToggle.toggleClass('is-enabled', timer.notifyStart);
        await onSave();
    });

    // End notification toggle
    const endRow = group.createDiv({ cls: 'wd-toggle-row' });
    const endLabelWrap = endRow.createDiv({ cls: 'wd-toggle-label-wrap' });
    endLabelWrap.createSpan({
        cls: 'wd-toggle-label',
        text: t('notifyEnd'),
    });
    endLabelWrap.createSpan({
        cls: 'wd-toggle-desc',
        text: t('notifyEndDesc'),
    });

    const endToggle = endRow.createDiv({ cls: 'checkbox-container' });
    if (timer.notifyEnd) endToggle.addClass('is-enabled');
    endToggle.addEventListener('click', async () => {
        timer.notifyEnd = !endToggle.hasClass('is-enabled');
        endToggle.toggleClass('is-enabled', timer.notifyEnd);
        await onSave();
    });
}
