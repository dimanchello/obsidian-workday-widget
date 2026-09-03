import { describe, it, expect } from 'vitest';
import { t } from './i18n';

describe('i18n t()', () => {
    it('returns translation for existing key in default/Russian locale', () => {
        expect(t('icon')).toBe('Иконка');
        expect(t('start')).toBe('Начало');
        expect(t('unitDay')).toBe('д');
    });

    it('returns translation for specified language', () => {
        expect(t('icon', undefined, 'en')).toBe('Icon');
        expect(t('icon', undefined, 'ru')).toBe('Иконка');
        expect(t('unitHour', undefined, 'en')).toBe('h');
        expect(t('unitHour', undefined, 'ru')).toBe('ч');
        expect(t('moveUp', undefined, 'en')).toBe('Move up');
        expect(t('moveDown', undefined, 'en')).toBe('Move down');
        expect(t('statusInvalidRange', undefined, 'en')).toBe('⚠️ Start date is after target date');
    });

    it('interpolates single parameter correctly', () => {
        expect(t('confirmDelete', { name: 'Work' }, 'en')).toBe('Delete timer "Work"?');
        expect(t('confirmDelete', { name: 'Работа' }, 'ru')).toBe('Удалить таймер "Работа"?');
    });

    it('interpolates multiple parameters correctly', () => {
        const textEn = t('tabTitleRange', { name: 'Shift', start: '09:00', end: '18:00' }, 'en');
        expect(textEn).toBe('Shift (09:00 – 18:00)');

        const textRu = t('tabTitleRange', { name: 'Смена', start: '09:00', end: '18:00' }, 'ru');
        expect(textRu).toBe('Смена (09:00 – 18:00)');
    });

    it('preserves placeholder if parameter is not supplied', () => {
        expect(t('confirmDelete', {}, 'en')).toBe('Delete timer "{name}"?');
    });

    it('falls back to key if key is completely unknown', () => {
        expect(t('non_existing_key_xyz')).toBe('non_existing_key_xyz');
        expect(t('non_existing_key_xyz', undefined, 'en')).toBe('non_existing_key_xyz');
    });
});
