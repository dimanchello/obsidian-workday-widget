import type { WorkspaceLeaf } from 'obsidian';
import { ItemView } from 'obsidian';
import { VIEW_TYPE } from '../constants';
import type { Panel, PanelElements, PluginBridge, TimerConfig } from '../types';
import { fromMin, durStr, durStrShort } from '../utils';
import { calcRange, calcCountdown } from '../timerLogic';
import { sendNotification } from '../notifications';
import { ConfirmModal } from '../modals/ConfirmModal';
import { t } from '../i18n';

export class WorkdayView extends ItemView {
    private plugin: PluginBridge;
    private interval: number | null = null;
    private activeIndex = 0;
    private panels: Record<number, Panel> = {};
    private tabsEl!: HTMLElement;
    private panelsEl!: HTMLElement;

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
        this.tabsEl.empty();

        if (timers.length <= 1) {
            this.tabsEl.style.display = 'none';
            return;
        }
        this.tabsEl.style.display = 'flex';

        let dragSrcIdx: number | null = null;

        timers.forEach((t, i) => {
            const tab = this.tabsEl.createDiv({
                cls: 'wd-tab' + (i === this.activeIndex ? ' active' : ''),
            });
            tab.textContent = t.emoji || '⏱️';
            tab.draggable = true;
            tab.title = this.makeTabTitle(t);

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
                this.tabsEl
                    .querySelectorAll('.wd-tab')
                    .forEach((el) => el.removeClass('wd-tab-drag-over'));
                dragSrcIdx = null;
            });

            tab.addEventListener('dragover', (e) => {
                const dt = e.dataTransfer;
                if (!dt) return;
                e.preventDefault();
                dt.dropEffect = 'move';
                if (dragSrcIdx === null || dragSrcIdx === i) return;
                this.tabsEl
                    .querySelectorAll('.wd-tab')
                    .forEach((el) => el.removeClass('wd-tab-drag-over'));
                tab.addClass('wd-tab-drag-over');
            });

            tab.addEventListener('dragleave', () => tab.removeClass('wd-tab-drag-over'));

            tab.addEventListener('drop', async (e) => {
                e.preventDefault();
                tab.removeClass('wd-tab-drag-over');
                if (dragSrcIdx === null || dragSrcIdx === i) return;

                const arr = this.plugin.settings.timers;
                const moved = arr.splice(dragSrcIdx, 1)[0];
                arr.splice(i, 0, moved);

                this.adjustActiveIndex(dragSrcIdx, i);
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
        if (i === this.activeIndex) return;

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

        this.tick();
    }

    private adjustActiveIndex(from: number, to: number): void {
        if (this.activeIndex === from) {
            this.activeIndex = to;
        } else if (from < this.activeIndex && to >= this.activeIndex) {
            this.activeIndex--;
        } else if (from > this.activeIndex && to <= this.activeIndex) {
            this.activeIndex++;
        }
    }

    private buildPanels(timers: TimerConfig[]): void {
        this.panelsEl.empty();
        this.panels = {};

        const isList = this.plugin.settings.displayMode === 'list';

        timers.forEach((timer, idx) => {
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

        let passedEl: HTMLElement;
        let leftEl: HTMLElement;
        let endEl: HTMLElement | undefined;

        if (timer.type === 'range') {
            const stats = wrap.createDiv({ cls: 'wd-stats' });
            passedEl = this.mkStat(stats, t('statPassed'), '#a6e3a1');
            leftEl = this.mkStat(stats, t('statLeft'), '#f38ba8');
            endEl = this.mkStat(stats, t('statEnd'), '#89b4fa');
        } else {
            const stats = wrap.createDiv({ cls: 'wd-stats wd-stats-2col' });
            passedEl = this.mkStat(stats, t('statPassed'), '#a6e3a1');
            leftEl = this.mkStat(stats, t('statLeft'), '#f38ba8');
        }

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
            passedEl,
            leftEl,
            endEl,
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
                this.plugin.settings.timers.splice(idx, 1);
                if (this.activeIndex >= this.plugin.settings.timers.length) {
                    this.activeIndex = Math.max(0, this.plugin.settings.timers.length - 1);
                }
                this.plugin.settings.activeIndex = this.activeIndex;
                await this.plugin.saveSettings();
                this.refresh();
            },
        ).open();
    }

    private startTick(): void {
        this.tick();
        this.interval = window.setInterval(() => this.tick(), 1000);
    }

    private stopTick(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private tick(): void {
        const { timers } = this.plugin.settings;
        if (!timers) return;

        const now = new Date();
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

            if (timer.type === 'range') {
                this.tickRange(timer, now, els);
            } else {
                this.tickCountdown(timer, now, els);
            }
        });
    }

    private tickRange(timer: TimerConfig, now: Date, els: PanelElements): void {
        const r = calcRange(timer, now);

        els.lblStart.textContent = fromMin(r.startM);
        els.lblEnd.textContent = fromMin(r.endM);
        if (els.endEl) els.endEl.textContent = fromMin(r.endM);
        els.barEl.style.width = `${r.pct.toFixed(2)}%`;
        els.lblPct.textContent = `${r.pct.toFixed(1)}%`;
        els.passedEl.textContent = durStrShort(r.passedM);
        els.leftEl.textContent = durStrShort(r.leftM);

        if (r.status === 'invalid') {
            this.setStatus(
                els,
                t('statusNoRange'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (r.status === 'before') {
            const hadFlags = timer.notifiedStart || timer.notifiedEnd;
            timer.notifiedStart = false;
            timer.notifiedEnd = false;
            if (hadFlags) {
                void this.plugin.saveSettings();
            }
            this.setStatus(
                els,
                t('statusBefore'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (r.status === 'done') {
            this.setStatus(els, t('statusDone'), '#a6e3a1', '#1e3a2f');
            if (timer.notifyEnd && !timer.notifiedEnd) {
                timer.notifiedEnd = true;
                void this.plugin.saveSettings();
                sendNotification(timer, 'end');
            }
            return;
        }

        this.setStatus(els, t('statusRunning'), '#89b4fa', '#1e2a3a');
        timer.notifiedEnd = false;
        if (timer.notifyStart && !timer.notifiedStart) {
            timer.notifiedStart = true;
            void this.plugin.saveSettings();
            sendNotification(timer, 'start');
        }
    }

    private tickCountdown(timer: TimerConfig, now: Date, els: PanelElements): void {
        const r = calcCountdown(timer, now);

        const fmt = (d: Date) =>
            d.toLocaleDateString([], {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });

        els.lblStart.textContent =
            r.hasStart && r.startDate ? fmt(r.startDate) : t('countdownNoStart');
        els.lblEnd.textContent = r.targetDate ? fmt(r.targetDate) : '—';

        els.barEl.style.width = `${r.pct.toFixed(2)}%`;
        els.lblPct.textContent = r.pct > 0 ? `${r.pct.toFixed(1)}%` : '';

        if (r.status === 'no-target') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusNoTarget'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (r.status === 'bad-target') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusBadTarget'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (r.status === 'bad-start') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusBadStart'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (r.isDone) {
            els.passedEl.textContent = r.totalSec ? durStr(r.totalSec) : '—';
            els.leftEl.textContent = '0с';
            if (els.deleteBtn) els.deleteBtn.style.display = 'inline-flex';
            this.setStatus(els, t('statusReached'), '#a6e3a1', '#1e3a2f');
            if (timer.notifyEnd && !timer.notifiedEnd) {
                timer.notifiedEnd = true;
                void this.plugin.saveSettings();
                sendNotification(timer, 'end');
            }
            return;
        }

        if (els.deleteBtn) els.deleteBtn.style.display = 'none';
        els.passedEl.textContent = r.passedSec !== null ? durStr(r.passedSec) : '—';
        els.leftEl.textContent = durStr(r.leftSec);
        this.setStatus(els, t('statusCountdown'), '#89b4fa', '#1e2a3a');

        timer.notifiedEnd = false;

        if (r.startDate && now >= r.startDate) {
            if (timer.notifyStart && !timer.notifiedStart) {
                timer.notifiedStart = true;
                void this.plugin.saveSettings();
                sendNotification(timer, 'start');
            }
        } else if (timer.notifiedStart) {
            timer.notifiedStart = false;
            void this.plugin.saveSettings();
        }
    }

    private setStatus(els: PanelElements, text: string, color: string, bg: string): void {
        els.statusEl.textContent = text;
        els.statusEl.style.color = color;
        els.statusEl.style.background = bg;
    }
}
