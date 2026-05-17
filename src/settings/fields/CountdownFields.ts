import { Setting } from 'obsidian';
import { TimerConfig } from '../../types';
import { inputStyle, todayStr } from '../../utils';

export function renderCountdownFields(
    card: HTMLElement,
    timer: TimerConfig,
    onSave: () => Promise<void>,
): void {
    const isNew = !timer.startDate?.trim() && !timer.targetDate?.trim();
    if (isNew) {
        timer.startDate = todayStr();
        void onSave();
    }

    const makeDatePicker = (
        name: string,
        desc: string,
        value: string,
        onChange: (v: string) => void,
    ) => {
        new Setting(card)
            .setName(name)
            .setDesc(desc)
            .addText((t) => {
                t.inputEl.type = 'date';
                t.inputEl.value = value;
                t.inputEl.style.cssText = inputStyle();
                t.inputEl.addEventListener('change', async (e) => {
                    onChange((e.target as HTMLInputElement).value);
                    await onSave();
                });
                return t;
            });
    };

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

    makeDatePicker(
        'Дата начала',
        'Необязательно. Если не указана — только осталось, без прогресса',
        timer.startDate || '',
        (v) => {
            timer.startDate = v;
        },
    );

    makeTimePicker('Время начала', timer.startTimeC || '09:00', (v) => {
        timer.startTimeC = v;
    });

    makeDatePicker('Дата цели', '', timer.targetDate || '', (v) => {
        timer.targetDate = v;
    });

    makeTimePicker('Время цели', timer.targetTime || '18:00', (v) => {
        timer.targetTime = v;
    });
}
