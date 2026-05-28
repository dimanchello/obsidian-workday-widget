import type { App } from 'obsidian';
import { Modal } from 'obsidian';
import { t } from '../i18n';

export class ConfirmModal extends Modal {
    private message: string;
    private onConfirm: () => void;

    constructor(app: App, message: string, onConfirm: () => void) {
        super(app);
        this.message = message;
        this.onConfirm = onConfirm;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('p', {
            text: this.message,
            attr: { style: 'font-size:15px;margin-bottom:16px;' },
        });

        const row = contentEl.createDiv({
            attr: { style: 'display:flex;gap:8px;justify-content:flex-end;' },
        });

        const cancelBtn = row.createEl('button', { text: t('cancel') });
        cancelBtn.style.cssText = 'padding:6px 14px;border-radius:5px;cursor:pointer;';
        cancelBtn.addEventListener('click', () => this.close());

        const confirmBtn = row.createEl('button', { text: t('confirmDeleteAction') });
        confirmBtn.style.cssText = [
            'padding:6px 14px',
            'border-radius:5px',
            'cursor:pointer',
            'background:var(--background-modifier-error)',
            'color:var(--text-on-accent)',
            'border:none',
            'font-weight:600',
        ].join(';');
        confirmBtn.addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}
