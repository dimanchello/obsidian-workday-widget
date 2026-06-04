import { Plugin } from 'obsidian';
import { VIEW_TYPE, DEFAULT_SETTINGS } from './constants';
import type { PluginSettings } from './types';
import { migrateSettings } from './migrations';
import { WorkdayView } from './views/WorkdayView';
import { WorkdaySettingTab } from './settings/SettingsTab';
import { t } from './i18n';

export default class WorkdayPlugin extends Plugin {
    settings!: PluginSettings;

    async onload(): Promise<void> {
        await this.loadSettings();

        this.registerView(VIEW_TYPE, (leaf) => new WorkdayView(leaf, this));

        this.addSettingTab(new WorkdaySettingTab(this.app, this));

        this.addRibbonIcon('timer', t('workdayWidget'), () => this.activateView());
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
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
            if (leaf.view instanceof WorkdayView) {
                leaf.view.refresh();
            }
        });
    }

    async loadSettings(): Promise<void> {
        const loaded = (await this.loadData()) as Partial<PluginSettings> | undefined;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

        if (!this.settings.timers || this.settings.timers.length === 0) {
            this.settings.timers = DEFAULT_SETTINGS.timers;
        }

        migrateSettings(this.settings.timers);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
