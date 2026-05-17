import { ItemView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE } from '../constants';
import { Panel, PanelElements, TimerConfig } from '../types';
import { toMin, fromMin, durStr, durStrShort, isValidDate } from '../utils';
import { sendNotification } from '../notifications';
import { ConfirmModal } from '../modals/ConfirmModal';
import WorkdayPlugin from '../main';

export class WorkdayView extends ItemView {
    private plugin: WorkdayPlugin;
    private interval: number | null = null;
    private activeIndex: number = 0;
    private panels: Record<number, Panel> = {};
    private tabsEl!: HTMLElement;
    private panelsEl!: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: WorkdayPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE;
    }
    getDisplayText(): string {
        return 'Таймеры';
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

    // ── Публичный метод для Settings ──────────────────────────────────────────

    refresh(): void {
        this.stopTick();
        this.buildUI();
    }

    // ── Сборка всего UI ───────────────────────────────────────────────────────

    private buildUI(): void {
        const root = this.containerEl.children[1] as HTMLElement;
        root.empty();
        root.addClass('workday-widget');

        const { timers } = this.plugin.settings;

        if (!timers || timers.length === 0) {
            root.createEl('p', {
                text: 'Нет таймеров. Добавь в Settings → Workday Widget.',
                attr: { style: 'color:var(--text-muted);font-size:13px;' },
            });
            return;
        }

        // Восстанавливаем сохранённый activeIndex
        this.activeIndex = this.plugin.settings.activeIndex ?? 0;
        if (this.activeIndex >= timers.length) this.activeIndex = 0;

        this.tabsEl = root.createDiv({ cls: 'wd-tabs' });
        this.panelsEl = root.createDiv();

        this.buildTabs(timers);
        this.buildPanels(timers);

        this.startTick();
    }

    // ── Пересборка без сброса интервала (после drag & drop) ──────────────────

    rebuild(): void {
        const { timers } = this.plugin.settings;
        if (this.activeIndex >= timers.length) this.activeIndex = 0;

        this.buildTabs(timers);
        this.buildPanels(timers);
        this.tick();
    }

    // ── Вкладки ───────────────────────────────────────────────────────────────

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

            // Клик
            tab.addEventListener('click', () => this.switchTab(i));

            // Drag
            tab.addEventListener('dragstart', (e) => {
                dragSrcIdx = i;
                e.dataTransfer!.effectAllowed = 'move';
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
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
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

    private makeTabTitle(t: TimerConfig): string {
        const name = t.name?.trim() || null;
        if (t.type === 'range') {
            return name
                ? `${name} (${t.startTime} – ${t.endTime})`
                : `Диапазон (${t.startTime} – ${t.endTime})`;
        }
        return name ? `${name} → ${t.targetDate || '?'}` : `До ${t.targetDate || '?'}`;
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
        this.plugin.saveSettings();

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

    // ── Панели ────────────────────────────────────────────────────────────────

    private buildPanels(timers: TimerConfig[]): void {
        this.panelsEl.empty();
        this.panels = {};

        timers.forEach((timer, idx) => {
            const wrap = this.panelsEl.createDiv();
            wrap.style.display = idx === this.activeIndex ? 'flex' : 'none';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '10px';
            this.panels[idx] = { wrap, els: this.buildPanel(wrap, timer) };
        });
    }

    private buildPanel(wrap: HTMLElement, timer: TimerConfig): PanelElements {
        // Header
        const hdr = wrap.createDiv({ cls: 'wd-header' });
        const titleEl = hdr.createDiv({ cls: 'wd-title' });
        titleEl.textContent = this.makePanelTitle(timer);
        const clockEl = hdr.createDiv({ cls: 'wd-clock' });

        // Bar labels
        const lbl = wrap.createDiv({ cls: 'wd-bar-labels' });
        const lblStart = lbl.createSpan();
        const lblPct = lbl.createSpan();
        const lblEnd = lbl.createSpan();

        // Bar
        const track = wrap.createDiv({ cls: 'wd-bar-track' });
        const barEl = track.createDiv({ cls: 'wd-bar-fill' });
        barEl.style.background = timer.color || '#7c6af7';

        // Stats
        let passedEl: HTMLElement;
        let leftEl: HTMLElement;
        let endEl: HTMLElement | undefined;

        if (timer.type === 'range') {
            const stats = wrap.createDiv({ cls: 'wd-stats' });
            passedEl = this.mkStat(stats, 'Прошло', '#a6e3a1');
            leftEl = this.mkStat(stats, 'Осталось', '#f38ba8');
            endEl = this.mkStat(stats, 'Конец', '#89b4fa');
        } else {
            const stats = wrap.createDiv({ cls: 'wd-stats wd-stats-2col' });
            passedEl = this.mkStat(stats, 'Прошло', '#a6e3a1');
            leftEl = this.mkStat(stats, 'Осталось', '#f38ba8');
        }

        // Status row
        const statusRow = wrap.createDiv({ cls: 'wd-status-row' });
        const statusEl = statusRow.createDiv({ cls: 'wd-status' });

        let deleteBtn: HTMLElement | undefined;
        if (timer.type === 'countdown') {
            deleteBtn = statusRow.createEl('button', { cls: 'wd-delete-btn', text: '🗑️' });
            deleteBtn.title = 'Удалить таймер';
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
            ? `${timer.emoji} Диапазонный таймер`
            : `${timer.emoji} Обратный отсчёт`;
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
            `Удалить таймер "${timer.name || timer.emoji}"?`,
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

    // ── Tick ──────────────────────────────────────────────────────────────────

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
        const nowStr = now.toLocaleTimeString('ru-RU', {
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
        const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        const startM = toMin(timer.startTime);
        const endM = toMin(timer.endTime);
        const totalM = endM > startM ? endM - startM : 0;

        els.lblStart.textContent = fromMin(startM);
        els.lblEnd.textContent = fromMin(endM);
        if (els.endEl) els.endEl.textContent = fromMin(endM);

        if (totalM <= 0) {
            this.setStatus(
                els,
                '⚠️ Укажи корректный диапазон',
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        let pct = 0,
            passedM = 0,
            leftM = 0;

        if (nowMin < startM) {
            timer.notified = false;
            leftM = totalM;
            this.setStatus(
                els,
                '⏳ Ещё не началось',
                'var(--text-muted)',
                'var(--background-secondary)',
            );
        } else if (nowMin >= endM) {
            pct = 100;
            passedM = totalM;
            this.setStatus(els, '🎉 Завершено!', '#a6e3a1', '#1e3a2f');
            if (timer.notify && !timer.notified) {
                timer.notified = true;
                void this.plugin.saveSettings();
                sendNotification(timer);
            }
        } else {
            const elapsed = nowMin - startM;
            pct = Math.min((elapsed / totalM) * 100, 100);
            passedM = elapsed;
            leftM = Math.max(0, totalM - elapsed);
            this.setStatus(els, '▶ Идёт', '#89b4fa', '#1e2a3a');
        }

        els.barEl.style.width = `${pct.toFixed(2)}%`;
        els.lblPct.textContent = `${pct.toFixed(1)}%`;
        els.passedEl.textContent = durStrShort(passedM);
        els.leftEl.textContent = durStrShort(leftM);
    }

    private tickCountdown(timer: TimerConfig, now: Date, els: PanelElements): void {
        if (!timer.targetDate?.trim()) {
            this.setStatus(
                els,
                '⚠️ Укажи дату цели',
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            return;
        }

        const target = new Date(`${timer.targetDate}T${timer.targetTime || '00:00'}:00`);
        if (!isValidDate(target)) {
            this.setStatus(
                els,
                '⚠️ Некорректная дата цели',
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            return;
        }

        const hasStart = !!timer.startDate?.trim();
        const start = hasStart
            ? new Date(`${timer.startDate}T${timer.startTimeC || '00:00'}:00`)
            : null;

        if (start && !isValidDate(start)) {
            this.setStatus(
                els,
                '⚠️ Некорректная дата начала',
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            return;
        }

        const leftSec = Math.max(0, (target.getTime() - now.getTime()) / 1000);
        const totalSec = start ? Math.max(0, (target.getTime() - start.getTime()) / 1000) : null;
        const passedSec = totalSec !== null ? Math.max(0, totalSec - leftSec) : null;
        const pct =
            totalSec !== null && totalSec > 0 && passedSec !== null
                ? Math.min((passedSec / totalSec) * 100, 100)
                : leftSec <= 0
                  ? 100
                  : 0;

        const fmt = (d: Date) =>
            d.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });

        els.lblStart.textContent = start ? fmt(start) : fmt(now);
        els.lblEnd.textContent = fmt(target);
        els.barEl.style.width = `${pct.toFixed(2)}%`;
        els.lblPct.textContent = pct > 0 ? `${pct.toFixed(1)}%` : '';

        const isDone = leftSec <= 0;

        if (isDone) {
            els.passedEl.textContent = totalSec ? durStr(totalSec) : '—';
            els.leftEl.textContent = '0с';
            if (els.deleteBtn) els.deleteBtn.style.display = 'inline-flex';
            this.setStatus(els, '🎉 Достигнуто!', '#a6e3a1', '#1e3a2f');
            if (timer.notify && !timer.notified) {
                timer.notified = true;
                void this.plugin.saveSettings();
                sendNotification(timer);
            }
        } else {
            timer.notified = false;
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            els.passedEl.textContent = passedSec !== null ? durStr(passedSec) : '—';
            els.leftEl.textContent = durStr(leftSec);
            this.setStatus(els, '⏳ Идёт отсчёт', '#89b4fa', '#1e2a3a');
        }
    }

    private setStatus(els: PanelElements, text: string, color: string, bg: string): void {
        els.statusEl.textContent = text;
        els.statusEl.style.color = color;
        els.statusEl.style.background = bg;
    }
}
