import type { App, Plugin } from 'obsidian';
import { PluginSettingTab } from 'obsidian';
import { DEFAULT_TIMER, EMOJIS } from '../constants';
import type { PluginBridge, TimerConfig } from '../types';
import { adjustIndexOnDelete, adjustIndexOnMove, debounce, todayStr, uid } from '../utils';
import { ConfirmModal } from '../modals/ConfirmModal';
import { renderRangeFields } from './fields/RangeFields';
import { renderCountdownFields } from './fields/CountdownFields';
import { t } from '../i18n';

export class WorkdaySettingTab extends PluginSettingTab {
    private plugin: PluginBridge;

    constructor(app: App, plugin: PluginBridge) {
        super(app, plugin as unknown as Plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: '⏱️ Workday Widget' });

        const displayRow = containerEl.createDiv({ cls: 'wd-settings-display-row' });
        displayRow.createEl('label', {
            cls: 'wd-form-label',
            text: t('displayMode'),
        });
        const displaySelect = displayRow.createEl('select', { cls: 'wd-form-select' });
        [
            { value: 'tabs', text: t('displayModeTabs') },
            { value: 'list', text: t('displayModeList') },
        ].forEach(({ value, text }) => {
            const opt = displaySelect.createEl('option', { text, value });
            if (value === this.plugin.settings.displayMode) opt.selected = true;
        });
        displaySelect.addEventListener('change', async () => {
            this.plugin.settings.displayMode = displaySelect.value as 'tabs' | 'list';
            await this.plugin.saveSettings();
            this.plugin.refreshView();
        });

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

        const debouncedSave = debounce(async () => {
            await onSave();
        }, 300);

        const row1 = card.createDiv({ cls: 'wd-card-row1' });

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
        colorPicker.addEventListener('input', () => {
            timer.color = colorPicker.value;
            debouncedSave();
        });

        const notifyStartField = row1.createDiv({ cls: 'wd-form-field' });
        notifyStartField.createEl('label', {
            cls: 'wd-form-label',
            text: t('notifyStart'),
            attr: { title: t('notifyStartHint') },
        });
        const toggleStart = notifyStartField.createDiv({ cls: 'checkbox-container' });
        if (timer.notifyStart) toggleStart.addClass('is-enabled');
        toggleStart.addEventListener('click', async () => {
            timer.notifyStart = !toggleStart.hasClass('is-enabled');
            toggleStart.toggleClass('is-enabled', timer.notifyStart);
            await onSave();
        });

        const notifyEndField = row1.createDiv({ cls: 'wd-form-field' });
        notifyEndField.createEl('label', {
            cls: 'wd-form-label',
            text: t('notifyEnd'),
            attr: { title: t('notifyEndHint') },
        });
        const toggleEnd = notifyEndField.createDiv({ cls: 'checkbox-container' });
        if (timer.notifyEnd) toggleEnd.addClass('is-enabled');
        toggleEnd.addEventListener('click', async () => {
            timer.notifyEnd = !toggleEnd.hasClass('is-enabled');
            toggleEnd.toggleClass('is-enabled', timer.notifyEnd);
            await onSave();
        });

        if (this.plugin.settings.timers.length > 1) {
            const moveUpBtn = row1.createEl('button', {
                cls: 'wd-move-btn',
                text: '↑',
                attr: { title: t('moveUp') },
            });
            if (idx === 0) moveUpBtn.disabled = true;
            moveUpBtn.addEventListener('click', async () => {
                const arr = this.plugin.settings.timers;
                const moved = arr.splice(idx, 1)[0];
                arr.splice(idx - 1, 0, moved);
                this.plugin.settings.activeIndex = adjustIndexOnMove(
                    this.plugin.settings.activeIndex,
                    idx,
                    idx - 1,
                );
                await this.plugin.saveSettings();
                this.plugin.refreshView();
                this.display();
            });

            const moveDownBtn = row1.createEl('button', {
                cls: 'wd-move-btn',
                text: '↓',
                attr: { title: t('moveDown') },
            });
            if (idx === this.plugin.settings.timers.length - 1) moveDownBtn.disabled = true;
            moveDownBtn.addEventListener('click', async () => {
                const arr = this.plugin.settings.timers;
                const moved = arr.splice(idx, 1)[0];
                arr.splice(idx + 1, 0, moved);
                this.plugin.settings.activeIndex = adjustIndexOnMove(
                    this.plugin.settings.activeIndex,
                    idx,
                    idx + 1,
                );
                await this.plugin.saveSettings();
                this.plugin.refreshView();
                this.display();
            });

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
                        this.plugin.settings.activeIndex = adjustIndexOnDelete(
                            this.plugin.settings.activeIndex,
                            idx,
                            this.plugin.settings.timers.length,
                        );
                        this.plugin.settings.timers.splice(idx, 1);
                        await this.plugin.saveSettings();
                        this.plugin.refreshView();
                        this.display();
                    },
                ).open();
            });
        }

        const row2 = card.createDiv({ cls: 'wd-form-row-2' });

        const nameField = row2.createDiv({ cls: 'wd-form-field' });
        nameField.createEl('label', { cls: 'wd-form-label', text: t('name') });
        const nameInput = nameField.createEl('input', {
            cls: 'wd-card-name-input',
            attr: { placeholder: t('myTimer') },
        });
        nameInput.value = timer.name || '';
        nameInput.addEventListener('input', () => {
            timer.name = nameInput.value.trim();
            debouncedSave();
        });

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
            if (timer.type === 'countdown' && !timer.startDatetime && !timer.targetDatetime) {
                timer.startDatetime = `${todayStr()}T09:00`;
            }
            await this.plugin.saveSettings();
            this.plugin.refreshView();
            this.display();
        });

        const asyncDebouncedSave = async () => {
            debouncedSave();
            await Promise.resolve();
        };

        if (timer.type === 'range') {
            renderRangeFields(card, timer, asyncDebouncedSave);
        } else {
            renderCountdownFields(card, timer, asyncDebouncedSave);
        }
    }
}
