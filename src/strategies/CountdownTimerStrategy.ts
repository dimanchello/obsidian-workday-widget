import type { PanelElements, TimerConfig, TimerType } from '../types';
import type {
    CountdownCalculationResult,
    TimerCalculationResult,
    TimerStrategy,
} from './TimerStrategy';
import { durStr, parseDatetime } from '../utils';
import { t } from '../i18n';

export class CountdownTimerStrategy implements TimerStrategy {
    readonly type: TimerType = 'countdown';

    calculate(timer: TimerConfig, now: Date): CountdownCalculationResult {
        const hasStart = !!timer.startDatetime;

        if (!timer.targetDatetime) {
            return {
                type: 'countdown',
                status: 'no-target',
                leftSec: 0,
                totalSec: null,
                passedSec: null,
                pct: 0,
                isDone: false,
                hasStart,
                targetDate: null,
                startDate: null,
            };
        }

        const target = parseDatetime(timer.targetDatetime);
        if (!target) {
            return {
                type: 'countdown',
                status: 'bad-target',
                leftSec: 0,
                totalSec: null,
                passedSec: null,
                pct: 0,
                isDone: false,
                hasStart,
                targetDate: null,
                startDate: null,
            };
        }

        const start = hasStart ? parseDatetime(timer.startDatetime) : null;
        if (hasStart && !start) {
            return {
                type: 'countdown',
                status: 'bad-start',
                leftSec: 0,
                totalSec: null,
                passedSec: null,
                pct: 0,
                isDone: false,
                hasStart: true,
                targetDate: null,
                startDate: null,
            };
        }

        if (start && start.getTime() >= target.getTime()) {
            return {
                type: 'countdown',
                status: 'invalid-range',
                leftSec: 0,
                totalSec: 0,
                passedSec: 0,
                pct: 0,
                isDone: false,
                hasStart: true,
                targetDate: target,
                startDate: start,
            };
        }

        if (start && now.getTime() < start.getTime()) {
            const leftToStartSec = Math.max(0, (start.getTime() - now.getTime()) / 1000);
            const totalSec = Math.max(0, (target.getTime() - start.getTime()) / 1000);
            return {
                type: 'countdown',
                status: 'before',
                leftSec: leftToStartSec,
                totalSec,
                passedSec: 0,
                pct: 0,
                isDone: false,
                hasStart: true,
                targetDate: target,
                startDate: start,
            };
        }

        const leftToEndSec = Math.max(0, (target.getTime() - now.getTime()) / 1000);
        const totalSec = start ? Math.max(0, (target.getTime() - start.getTime()) / 1000) : null;
        const passedSec = totalSec !== null ? Math.max(0, totalSec - leftToEndSec) : null;
        const isDone = leftToEndSec <= 0;
        const pct =
            totalSec !== null && totalSec > 0 && passedSec !== null
                ? Math.min((passedSec / totalSec) * 100, 100)
                : isDone
                  ? 100
                  : 0;

        return {
            type: 'countdown',
            status: isDone ? 'done' : 'running',
            leftSec: leftToEndSec,
            totalSec,
            passedSec,
            pct,
            isDone,
            hasStart,
            targetDate: target,
            startDate: start,
        };
    }

    renderStats(
        parent: HTMLElement,
        mkStat: (parent: HTMLElement, label: string, color: string) => HTMLElement,
    ): { passedEl: HTMLElement; leftEl: HTMLElement } {
        const stats = parent.createDiv({ cls: 'wd-stats wd-stats-2col' });
        const passedEl = mkStat(stats, t('statPassed'), '#a6e3a1');
        const leftEl = mkStat(stats, t('statLeft'), '#f38ba8');
        return { passedEl, leftEl };
    }

    updateUI(timer: TimerConfig, result: TimerCalculationResult, els: PanelElements): void {
        if (result.type !== 'countdown') return;

        const fmt = (d: Date) =>
            d.toLocaleDateString([], {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });

        els.lblStart.textContent =
            result.hasStart && result.startDate ? fmt(result.startDate) : t('countdownNoStart');
        els.lblEnd.textContent = result.targetDate ? fmt(result.targetDate) : '—';

        els.barEl.style.width = `${result.pct.toFixed(2)}%`;
        els.lblPct.textContent = result.pct > 0 ? `${result.pct.toFixed(1)}%` : '';

        if (result.status === 'no-target') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusNoTarget'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.status === 'bad-target') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusBadTarget'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.status === 'bad-start') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusBadStart'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.status === 'invalid-range') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            this.setStatus(
                els,
                t('statusInvalidRange'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.status === 'before') {
            if (els.deleteBtn) els.deleteBtn.style.display = 'none';
            els.passedEl.textContent = '0с';
            els.leftEl.textContent = durStr(result.leftSec);
            this.setStatus(
                els,
                t('statusBefore'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.isDone) {
            els.passedEl.textContent = result.totalSec ? durStr(result.totalSec) : '—';
            els.leftEl.textContent = '0с';
            if (els.deleteBtn) els.deleteBtn.style.display = 'inline-flex';
            this.setStatus(els, t('statusReached'), '#a6e3a1', '#1e3a2f');
            return;
        }

        if (els.deleteBtn) els.deleteBtn.style.display = 'none';
        els.passedEl.textContent = result.passedSec !== null ? durStr(result.passedSec) : '—';
        els.leftEl.textContent = durStr(result.leftSec);
        this.setStatus(els, t('statusCountdown'), '#89b4fa', '#1e2a3a');
    }

    private setStatus(els: PanelElements, text: string, color: string, bg: string): void {
        els.statusEl.textContent = text;
        els.statusEl.style.color = color;
        els.statusEl.style.background = bg;
    }
}
