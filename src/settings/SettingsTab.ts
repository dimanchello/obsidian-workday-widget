import { App, PluginSettingTab, Setting } from 'obsidian';
import { EMOJIS } from '../constants';
import { TimerConfig } from '../types';
import { uid } from '../utils';
import { DEFAULT_TIMER } from '../constants';
import { ConfirmModal } from '../modals/ConfirmModal';
import { renderRangeFields } from './fields/RangeFields';
import { renderCountdownFields } from './fields/CountdownFields';
import WorkdayPlugin from '../main';

export class WorkdaySettingTab extends PluginSettingTab {
    private plugin: WorkdayPlugin;

    constructor(app: App, plugin: WorkdayPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: '⏱️ Workday Widget' });

        const listEl = containerEl.createDiv();
        this.plugin.settings.timers.forEach((timer, idx) => {
            const card = listEl.createDiv({ cls: 'wd-settings-timer-card' });
            this.renderTimerCard(card, timer, idx);
        });

        const addBtn = containerEl.createEl('button', {
            cls: 'wd-add-btn',
            text: '+ Добавить таймер',
        });
        addBtn.addEventListener('click', async () => {
            this.plugin.settings.timers.push({
                ...DEFAULT_TIMER,
                id: uid(),
                emoji: '⏱️',
                name: '',
            });
            await this.plugin.saveSettings();
            this.plugin.refreshView();
            this.display();
        });
    }

    private renderTimerCard(card: HTMLElement, timer: TimerConfig, idx: number): void {
        const hdr = card.createDiv({ cls: 'wd-settings-timer-header' });
        const titleEl = hdr.createDiv({ cls: 'wd-settings-timer-title' });
        titleEl.textContent = `${timer.emoji} ${timer.name || `Таймер ${idx + 1}`}`;

        if (this.plugin.settings.timers.length > 1) {
            const delBtn = hdr.createEl('button', { cls: 'wd-del-btn', text: '✕ Удалить' });
            delBtn.addEventListener('click', () => {
                new ConfirmModal(
                    this.plugin.app,
                    `Удалить таймер "${timer.name || timer.emoji}"?`,
                    async () => {
                        this.plugin.settings.timers.splice(idx, 1);
                        await this.plugin.saveSettings();
                        this.plugin.refreshView();
                        this.display();
                    },
                ).open();
            });
        }

        // Название
        new Setting(card)
            .setName('Название')
            .setDesc('Отображается при наведении на вкладку и в уведомлении')
            .addText((t) =>
                t
                    .setPlaceholder('Мой таймер')
                    .setValue(timer.name || '')
                    .onChange(async (v) => {
                        timer.name = v.trim();
                        titleEl.textContent = `${timer.emoji} ${timer.name || `Таймер ${idx + 1}`}`;
                        await this.plugin.saveSettings();
                        this.plugin.refreshView();
                    }),
            );

        // Эмодзи
        card.createEl('div', {
            text: 'Иконка',
            attr: { style: 'font-size:12px;color:var(--text-muted);margin:8px 0 4px;' },
        });
        const emojiGrid = card.createDiv({ cls: 'wd-emoji-grid' });
        EMOJIS.forEach((em) => {
            const btn = emojiGrid.createEl('button', { cls: 'wd-emoji-btn', text: em });
            if (em === timer.emoji) btn.addClass('active');
            btn.addEventListener('click', async () => {
                timer.emoji = em;
                emojiGrid.querySelectorAll('.wd-emoji-btn').forEach((b) => b.removeClass('active'));
                btn.addClass('active');
                titleEl.textContent = `${em} ${timer.name || `Таймер ${idx + 1}`}`;
                await this.plugin.saveSettings();
                this.plugin.refreshView();
            });
        });

        // Тип
        new Setting(card).setName('Тип таймера').addDropdown((dd) =>
            dd
                .addOption('range', '⏱ Диапазонный (ежедневно, от времени до времени)')
                .addOption('countdown', '📅 Обратный отсчёт (до конкретной даты)')
                .setValue(timer.type || 'range')
                .onChange(async (v) => {
                    timer.type = v as TimerConfig['type'];
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                    this.display();
                }),
        );

        // Цвет
        new Setting(card).setName('Цвет прогресс-бара').addColorPicker((cp) =>
            cp.setValue(timer.color || '#7c6af7').onChange(async (v) => {
                timer.color = v;
                await this.plugin.saveSettings();
                this.plugin.refreshView();
            }),
        );

        // Уведомление
        new Setting(card)
            .setName('Уведомление при завершении')
            .setDesc('Системное уведомление когда таймер закончится')
            .addToggle((toggle) =>
                toggle.setValue(timer.notify ?? false).onChange(async (v) => {
                    timer.notify = v;
                    await this.plugin.saveSettings();
                }),
            );

        // Поля в зависимости от типа
        const onSave = async () => {
            await this.plugin.saveSettings();
            this.plugin.refreshView();
        };

        if (timer.type === 'range') {
            renderRangeFields(card, timer, onSave);
        } else {
            renderCountdownFields(card, timer, onSave);
        }
    }
}
