import type { PanelElements, TimerConfig, TimerType } from '../types';
import type {
    RangeCalculationResult,
    TimerCalculationResult,
    TimerStrategy,
} from './TimerStrategy';
import { durStrShort, fromMin, toMin } from '../utils';
import { t } from '../i18n';

export class RangeTimerStrategy implements TimerStrategy {
    readonly type: TimerType = 'range';

    calculate(timer: TimerConfig, now: Date): RangeCalculationResult {
        const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        const startM = toMin(timer.startTime);
        const endM = toMin(timer.endTime);
        const totalM = endM > startM ? endM - startM : 0;

        if (totalM <= 0) {
            return {
                type: 'range',
                status: 'invalid',
                startM,
                endM,
                totalM: 0,
                pct: 0,
                passedM: 0,
                leftM: 0,
            };
        }

        if (nowMin < startM) {
            return {
                type: 'range',
                status: 'before',
                startM,
                endM,
                totalM,
                pct: 0,
                passedM: 0,
                leftM: startM - nowMin,
            };
        }

        if (nowMin >= endM) {
            return {
                type: 'range',
                status: 'done',
                startM,
                endM,
                totalM,
                pct: 100,
                passedM: totalM,
                leftM: 0,
            };
        }

        const elapsed = nowMin - startM;
        return {
            type: 'range',
            status: 'running',
            startM,
            endM,
            totalM,
            pct: Math.min((elapsed / totalM) * 100, 100),
            passedM: elapsed,
            leftM: Math.max(0, totalM - elapsed),
        };
    }

    renderStats(
        parent: HTMLElement,
        mkStat: (parent: HTMLElement, label: string, color: string) => HTMLElement,
    ): { passedEl: HTMLElement; leftEl: HTMLElement; endEl: HTMLElement } {
        const stats = parent.createDiv({ cls: 'wd-stats' });
        const passedEl = mkStat(stats, t('statPassed'), '#a6e3a1');
        const leftEl = mkStat(stats, t('statLeft'), '#f38ba8');
        const endEl = mkStat(stats, t('statEnd'), '#89b4fa');
        return { passedEl, leftEl, endEl };
    }

    updateUI(timer: TimerConfig, result: TimerCalculationResult, els: PanelElements): void {
        if (result.type !== 'range') return;

        els.lblStart.textContent = fromMin(result.startM);
        els.lblEnd.textContent = fromMin(result.endM);
        if (els.endEl) els.endEl.textContent = fromMin(result.endM);

        els.barEl.style.width = `${result.pct.toFixed(2)}%`;
        els.lblPct.textContent = `${result.pct.toFixed(1)}%`;
        els.passedEl.textContent = durStrShort(result.passedM);
        els.leftEl.textContent = durStrShort(result.leftM);

        if (result.status === 'invalid') {
            this.setStatus(
                els,
                t('statusNoRange'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.status === 'before') {
            this.setStatus(
                els,
                t('statusBefore'),
                'var(--text-muted)',
                'var(--background-secondary)',
            );
            return;
        }

        if (result.status === 'done') {
            this.setStatus(els, t('statusDone'), '#a6e3a1', '#1e3a2f');
            return;
        }

        this.setStatus(els, t('statusRunning'), '#89b4fa', '#1e2a3a');
    }

    private setStatus(els: PanelElements, text: string, color: string, bg: string): void {
        els.statusEl.textContent = text;
        els.statusEl.style.color = color;
        els.statusEl.style.background = bg;
    }
}
