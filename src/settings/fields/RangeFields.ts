import { Setting } from 'obsidian';
import { TimerConfig } from '../../types';
import { inputStyle } from '../../utils';

export function renderRangeFields(
    card: HTMLElement,
    timer: TimerConfig,
    onSave: () => Promise<void>,
): void {
    const makeTimePicker = (name: string, value: string, onChange: (v: string) => void) => {
        new Setting(card).setName(name).addText((t) => {
            t.inputEl.type = 'time';
            t.inputEl.value = value;
            t.inputEl.style.cssText = inputStyle();
            t.inputEl.addEventListener('change', async (e) => {
                onChange((e.target as HTMLInputElement).value);
                await onSave();
            });
            return t;
        });
    };

    makeTimePicker('Время начала', timer.startTime || '09:00', (v) => {
        timer.startTime = v;
    });

    makeTimePicker('Время окончания', timer.endTime || '18:00', (v) => {
        timer.endTime = v;
    });
}
