import { App, PluginSettingTab } from 'obsidian';
import { EMOJIS, DEFAULT_TIMER } from '../constants';
import { TimerConfig } from '../types';
import { uid } from '../utils';
import { ConfirmModal } from '../modals/ConfirmModal';
import { renderRangeFields } from './fields/RangeFields';
import { renderCountdownFields } from './fields/CountdownFields';
import WorkdayPlugin from '../main';
import { t } from '../i18n';

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
            text: t('addTimer'),
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
        const onSave = async () => {
            await this.plugin.saveSettings();
            this.plugin.refreshView();
        };

        // Row 1: emoji trigger, color, notify, delete
        const row1 = card.createDiv({ cls: 'wd-card-row1' });

        // Emoji
        const emojiField = row1.createDiv({ cls: 'wd-form-field' });
        emojiField.createEl('label', {
            cls: 'wd-form-label',
            text: t('icon'),
            attr: { title: t('iconHint') },
        });
        const emojiTrigger = emojiField.createEl('button', {
            cls: 'wd-emoji-trigger',
            text: timer.emoji,
        });

        // Emoji collapsible panel
        const emojiPanelWrap = card.createDiv({ cls: 'wd-emoji-panel-wrap' });
        const emojiGrid = emojiPanelWrap.createDiv({ cls: 'wd-emoji-grid' });
        EMOJIS.forEach((em) => {
            const btn = emojiGrid.createEl('button', { cls: 'wd-emoji-option', text: em });
            if (em === timer.emoji) btn.addClass('active');
            btn.addEventListener('click', async () => {
                timer.emoji = em;
                emojiTrigger.textContent = em;
                emojiGrid
                    .querySelectorAll('.wd-emoji-option')
                    .forEach((b) => b.removeClass('active'));
                btn.addClass('active');
                emojiPanelWrap.removeClass('open');
                emojiTrigger.removeClass('open');
                await onSave();
            });
        });

        emojiTrigger.addEventListener('click', () => {
            const wasOpen = emojiPanelWrap.hasClass('open');
            const listEl = card.parentElement;
            if (listEl) {
                listEl
                    .querySelectorAll('.wd-emoji-panel-wrap.open')
                    .forEach((el) => el.removeClass('open'));
                listEl
                    .querySelectorAll('.wd-emoji-trigger.open')
                    .forEach((el) => el.removeClass('open'));
            }
            if (!wasOpen) {
                emojiPanelWrap.addClass('open');
                emojiTrigger.addClass('open');
            }
        });

        // Color
        const colorField = row1.createDiv({ cls: 'wd-form-field' });
        colorField.createEl('label', {
            cls: 'wd-form-label',
            text: t('color'),
            attr: { title: t('colorHint') },
        });
        const colorWrap = colorField.createDiv({ cls: 'wd-form-color-wrap' });
        const colorPicker = colorWrap.createEl('input', {
            attr: { type: 'color', value: timer.color || '#7c6af7' },
        });
        colorPicker.addEventListener('input', async () => {
            timer.color = colorPicker.value;
            await onSave();
        });

        // Notify
        const notifyField = row1.createDiv({ cls: 'wd-form-field' });
        notifyField.createEl('label', {
            cls: 'wd-form-label',
            text: t('notify'),
            attr: { title: t('notifyHint') },
        });
        const toggleWrap = notifyField.createDiv({ cls: 'checkbox-container' });
        if (timer.notify) toggleWrap.addClass('is-enabled');
        toggleWrap.addEventListener('click', async () => {
            timer.notify = !toggleWrap.hasClass('is-enabled');
            toggleWrap.toggleClass('is-enabled', timer.notify);
            await onSave();
        });

        // Delete button
        if (this.plugin.settings.timers.length > 1) {
            const delBtn = row1.createEl('button', {
                cls: 'wd-del-btn',
                text: '✕',
                attr: { title: t('deleteTimer') },
            });
            delBtn.addEventListener('click', () => {
                new ConfirmModal(
                    this.plugin.app,
                    t('confirmDelete', { name: timer.name || timer.emoji }),
                    async () => {
                        this.plugin.settings.timers.splice(idx, 1);
                        await this.plugin.saveSettings();
                        this.plugin.refreshView();
                        this.display();
                    },
                ).open();
            });
        }

        // Row 2: name + type
        const row2 = card.createDiv({ cls: 'wd-form-row-2' });

        // Name
        const nameField = row2.createDiv({ cls: 'wd-form-field' });
        nameField.createEl('label', { cls: 'wd-form-label', text: t('name') });
        const nameInput = nameField.createEl('input', {
            cls: 'wd-card-name-input',
            attr: { placeholder: t('myTimer') },
        });
        nameInput.value = timer.name || '';
        nameInput.addEventListener('input', async () => {
            timer.name = nameInput.value.trim();
            await onSave();
        });

        // Type
        const typeField = row2.createDiv({ cls: 'wd-form-field' });
        typeField.createEl('label', { cls: 'wd-form-label', text: t('type') });
        const typeSelect = typeField.createEl('select', { cls: 'wd-form-select' });
        [
            { value: 'range', text: t('range') },
            { value: 'countdown', text: t('countdown') },
        ].forEach(({ value, text }) => {
            const opt = typeSelect.createEl('option', { text, value });
            if (value === timer.type) opt.selected = true;
        });
        typeSelect.addEventListener('change', async () => {
            timer.type = typeSelect.value as TimerConfig['type'];
            await this.plugin.saveSettings();
            this.plugin.refreshView();
            this.display();
        });

        // Row 3: type-specific fields
        if (timer.type === 'range') {
            renderRangeFields(card, timer, onSave);
        } else {
            renderCountdownFields(card, timer, onSave);
        }
    }
}
