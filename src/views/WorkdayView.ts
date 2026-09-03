import type { WorkspaceLeaf } from 'obsidian';
import { ItemView } from 'obsidian';
import { VIEW_TYPE } from '../constants';
import type { Panel, PanelElements, PluginBridge, TimerConfig } from '../types';
import { adjustIndexOnDelete, adjustIndexOnMove } from '../utils';
import { TimerStrategyFactory } from '../strategies/TimerStrategyFactory';
import { ConfirmModal } from '../modals/ConfirmModal';
import { t } from '../i18n';

export class WorkdayView extends ItemView {
    private plugin: PluginBridge;
    private unsubscribeTimer: (() => void) | null = null;
    private activeIndex = 0;
    private panels: Record<number, Panel> = {};
    private tabsEl: HTMLElement | null = null;
    private panelsEl: HTMLElement | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: PluginBridge) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE;
    }
    getDisplayText(): string {
        return 'Workday Widget';
    }
    getIcon(): string {
        return 'timer';
    }

    async onOpen(): Promise<void> {
        this.buildUI();
    }
    async onClose(): Promise<void> {
        this.stopTick();
    }

    refresh(): void {
        this.stopTick();
        this.buildUI();
    }

    private buildUI(): void {
        const root = this.containerEl.children[1] as HTMLElement;
        root.empty();
        root.addClass('workday-widget');

        const { timers, displayMode } = this.plugin.settings;

        if (!timers || timers.length === 0) {
            root.createEl('p', {
                text: t('noTimers'),
                attr: { style: 'color:var(--text-muted);font-size:13px;' },
            });
            this.tabsEl = null;
            this.panelsEl = null;
            return;
        }

        this.activeIndex = this.plugin.settings.activeIndex ?? 0;
        if (this.activeIndex >= timers.length) this.activeIndex = 0;

        this.tabsEl = root.createDiv({ cls: 'wd-tabs' });
        this.panelsEl = root.createDiv();

        if (displayMode === 'list') {
            this.tabsEl.style.display = 'none';
        } else {
            this.buildTabs(timers);
        }
        this.buildPanels(timers);

        this.startTick();
    }

    rebuild(): void {
        this.stopTick();

        const { timers, displayMode } = this.plugin.settings;
        if (!timers || timers.length === 0 || !this.tabsEl || !this.panelsEl) {
            this.buildUI();
            return;
        }

        if (this.activeIndex >= timers.length) this.activeIndex = 0;

        if (displayMode === 'list') {
            this.tabsEl.style.display = 'none';
        } else {
            this.buildTabs(timers);
        }
        this.buildPanels(timers);

        this.startTick();
    }

    private buildTabs(timers: TimerConfig[]): void {
        if (!this.tabsEl) return;
        this.tabsEl.empty();

        if (timers.length <= 1) {
            this.tabsEl.style.display = 'none';
            return;
        }
        this.tabsEl.style.display = 'flex';

        let dragSrcIdx: number | null = null;

        timers.forEach((timer, i) => {
            if (!this.tabsEl) return;
            const tab = this.tabsEl.createDiv({
                cls: 'wd-tab' + (i === this.activeIndex ? ' active' : ''),
            });
            tab.textContent = timer.emoji || '⏱️';
            tab.draggable = true;
            tab.title = this.makeTabTitle(timer);

            if (i === this.activeIndex) {
                setTimeout(() => tab.scrollIntoView({ block: 'nearest', inline: 'center' }), 50);
            }

            tab.addEventListener('click', () => this.switchTab(i));

            tab.addEventListener('dragstart', (e) => {
                const dt = e.dataTransfer;
                if (!dt) return;
                dragSrcIdx = i;
                dt.effectAllowed = 'move';
                setTimeout(() => tab.addClass('wd-tab-dragging'), 0);
            });

            tab.addEventListener('dragend', () => {
                tab.removeClass('wd-tab-dragging');
                if (this.tabsEl) {
                    this.tabsEl
                        .querySelectorAll('.wd-tab')
                        .forEach((el) => el.removeClass('wd-tab-drag-over'));
                }
                dragSrcIdx = null;
            });

            tab.addEventListener('dragover', (e) => {
                const dt = e.dataTransfer;
                if (!dt) return;
                e.preventDefault();
                dt.dropEffect = 'move';
                if (dragSrcIdx === null || dragSrcIdx === i) return;
                if (this.tabsEl) {
                    this.tabsEl
                        .querySelectorAll('.wd-tab')
                        .forEach((el) => el.removeClass('wd-tab-drag-over'));
                }
                tab.addClass('wd-tab-drag-over');
            });

            tab.addEventListener('dragleave', () => tab.removeClass('wd-tab-drag-over'));

            tab.addEventListener('drop', async (e) => {
                e.preventDefault();
                tab.removeClass('wd-tab-drag-over');
                if (dragSrcIdx === null || dragSrcIdx === i) return;

                const fromIdx = dragSrcIdx;
                const toIdx = i;
                const arr = this.plugin.settings.timers;
                const moved = arr.splice(fromIdx, 1)[0];
                arr.splice(toIdx, 0, moved);

                this.activeIndex = adjustIndexOnMove(this.activeIndex, fromIdx, toIdx);
                dragSrcIdx = null;

                this.plugin.settings.activeIndex = this.activeIndex;
                await this.plugin.saveSettings();
                this.rebuild();
            });
        });
    }

    private makeTabTitle(timer: TimerConfig): string {
        const name = timer.name?.trim() || null;
        if (timer.type === 'range') {
            if (name) {
                return t('tabTitleRange', { name, start: timer.startTime, end: timer.endTime });
            }
            return t('tabTitleRangeNoName', { start: timer.startTime, end: timer.endTime });
        }
        if (name) {
            return t('tabTitleCountdown', {
                name,
                date: timer.targetDatetime?.slice(0, 10) || '?',
            });
        }
        return t('tabTitleCountdownNoName', { date: timer.targetDatetime?.slice(0, 10) || '?' });
    }

    private switchTab(i: number): void {
        if (i === this.activeIndex || !this.tabsEl) return;

        if (this.panels[this.activeIndex]) {
            this.panels[this.activeIndex].wrap.style.display = 'none';
        }
        this.tabsEl.querySelectorAll('.wd-tab').forEach((el) => el.removeClass('active'));

        this.activeIndex = i;
        const tabs = this.tabsEl.querySelectorAll('.wd-tab');
        tabs[i]?.addClass('active');
        tabs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });

        if (this.panels[i]) this.panels[i].wrap.style.display = 'flex';

        this.plugin.settings.activeIndex = i;
        void this.plugin.saveSettings();

        this.tick(new Date());
    }

    private buildPanels(timers: TimerConfig[]): void {
        if (!this.panelsEl) return;
        this.panelsEl.empty();
        this.panels = {};

        const isList = this.plugin.settings.displayMode === 'list';

        timers.forEach((timer, idx) => {
            if (!this.panelsEl) return;
            const wrap = this.panelsEl.createDiv();
            wrap.style.display = !isList && idx !== this.activeIndex ? 'none' : 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '10px';
            if (isList) {
                wrap.addClass('wd-panel-list-item');
            }
            this.panels[idx] = { wrap, els: this.buildPanel(wrap, timer) };
        });
    }

    private buildPanel(wrap: HTMLElement, timer: TimerConfig): PanelElements {
        const hdr = wrap.createDiv({ cls: 'wd-header' });
        const titleEl = hdr.createDiv({ cls: 'wd-title' });
        titleEl.textContent = this.makePanelTitle(timer);
        const clockEl = hdr.createDiv({ cls: 'wd-clock' });

        const lbl = wrap.createDiv({ cls: 'wd-bar-labels' });
        const lblStart = lbl.createSpan();
        const lblPct = lbl.createSpan();
        const lblEnd = lbl.createSpan();

        const track = wrap.createDiv({ cls: 'wd-bar-track' });
        const barEl = track.createDiv({ cls: 'wd-bar-fill' });
        barEl.style.background = timer.color || '#7c6af7';

        const strategy = TimerStrategyFactory.getStrategy(timer.type);
        const stats = strategy.renderStats(wrap, (p, label, color) => this.mkStat(p, label, color));

        const statusRow = wrap.createDiv({ cls: 'wd-status-row' });
        const statusEl = statusRow.createDiv({ cls: 'wd-status' });

        let deleteBtn: HTMLElement | undefined;
        if (timer.type === 'countdown') {
            deleteBtn = statusRow.createEl('button', { cls: 'wd-delete-btn', text: '🗑️' });
            deleteBtn.title = t('deleteTimer');
            deleteBtn.style.display = 'none';
            deleteBtn.addEventListener('click', () => this.confirmDelete(timer));
        }

        return {
            titleEl,
            clockEl,
            lblStart,
            lblPct,
            lblEnd,
            barEl,
            passedEl: stats.passedEl,
            leftEl: stats.leftEl,
            endEl: stats.endEl,
            statusEl,
            deleteBtn,
        };
    }

    private makePanelTitle(timer: TimerConfig): string {
        if (timer.name) return `${timer.emoji} ${timer.name}`;
        return timer.type === 'range'
            ? `${timer.emoji} ${t('timerRangeDefault')}`
            : `${timer.emoji} ${t('timerCountdownDefault')}`;
    }

    private mkStat(parent: HTMLElement, label: string, color: string): HTMLElement {
        const card = parent.createDiv({ cls: 'wd-stat' });
        card.createDiv({ cls: 'wd-stat-label', text: label });
        const val = card.createDiv({ cls: 'wd-stat-value' });
        val.style.color = color;
        return val;
    }

    private confirmDelete(timer: TimerConfig): void {
        new ConfirmModal(
            this.plugin.app,
            t('confirmDelete', { name: timer.name || timer.emoji }),
            async () => {
                const idx = this.plugin.settings.timers.findIndex((t) => t.id === timer.id);
                if (idx === -1) return;
                this.activeIndex = adjustIndexOnDelete(
                    this.activeIndex,
                    idx,
                    this.plugin.settings.timers.length,
                );
                this.plugin.settings.timers.splice(idx, 1);
                this.plugin.settings.activeIndex = this.activeIndex;
                await this.plugin.saveSettings();
                this.refresh();
            },
        ).open();
    }

    private startTick(): void {
        this.tick(new Date());
        if (this.plugin.timerEngine) {
            this.unsubscribeTimer = this.plugin.timerEngine.subscribe((now) => this.tick(now));
        }
    }

    private stopTick(): void {
        if (this.unsubscribeTimer !== null) {
            this.unsubscribeTimer();
            this.unsubscribeTimer = null;
        }
    }

    private tick(now: Date = new Date()): void {
        const { timers } = this.plugin.settings;
        if (!timers) return;

        const nowStr = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        timers.forEach((timer, idx) => {
            const p = this.panels[idx];
            if (!p) return;
            const { els } = p;
            if (els.clockEl) els.clockEl.textContent = nowStr;

            const strategy = TimerStrategyFactory.getStrategy(timer.type);
            const result = strategy.calculate(timer, now);
            strategy.updateUI(timer, result, els);
        });
    }
}
