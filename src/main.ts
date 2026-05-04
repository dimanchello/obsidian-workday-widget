import { Plugin }            from 'obsidian';
import { VIEW_TYPE, DEFAULT_SETTINGS } from './constants';
import { PluginSettings }    from './types';
import { fromMin, toMin }    from './utils';
import { WorkdayView }       from './views/WorkdayView';
import { WorkdaySettingTab } from './settings/SettingsTab';

export default class WorkdayPlugin extends Plugin {
    settings!: PluginSettings;

    async onload(): Promise<void> {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE,
            leaf => new WorkdayView(leaf, this),
        );

        this.addSettingTab(new WorkdaySettingTab(this.app, this));

        this.addRibbonIcon('timer', 'Workday Widget', () => this.activateView());

        this.app.workspace.onLayoutReady(() => this.activateView());
    }

    async onunload(): Promise<void> {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
    }

    async activateView(): Promise<void> {
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE);
        if (existing.length > 0) {
            await this.app.workspace.revealLeaf(existing[0]);
            return;
        }
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
            await this.app.workspace.revealLeaf(leaf);
        }
    }

    refreshView(): void {
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(leaf => {
            if (leaf.view instanceof WorkdayView) {
                leaf.view.refresh();
            }
        });
    }

    async loadSettings(): Promise<void> {
        const loaded = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

        if (!this.settings.timers || this.settings.timers.length === 0) {
            this.settings.timers = DEFAULT_SETTINGS.timers;
        }

        // Миграция: workday → range
        this.settings.timers.forEach(t => {
            if ((t.type as string) === 'workday') {
                t.type    = 'range';
                t.endTime = fromMin(
                    toMin(t.startTime) +
                    ((t as any).workHours  || 8)  * 60 +
                    ((t as any).lunchMin   || 0),
                );
            }
        });
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
