# AGENTS.md

## Команды

```bash
npm run dev           # Режим разработки (watch)
npm run build         # Продакшн сборка в dist/
npm run lint          # Проверка линтером
npm run lint:fix      # Автоисправление линтера
npm run format        # Форматирование кода
npm run format:check  # Проверка форматирования
npm run test          # Запуск unit тестов
npm run test:watch    # Тесты в режиме watch
npm run typecheck     # Проверка типов TypeScript
npm run validate      # typecheck + lint + format + test
```

## Структура проекта

```
src/
├── main.ts              # Точка входа, класс плагина
├── types.ts             # TypeScript типы
├── constants.ts         # Константы и дефолтные значения
├── utils.ts             # Чистые утилиты (покрываются тестами)
├── notifications.ts     # Системные уведомления
├── modals/
│   └── ConfirmModal.ts  # Модалка подтверждения
├── views/
│   └── WorkdayView.ts   # Основной виджет (ItemView)
└── settings/
    ├── SettingsTab.ts   # Вкладка настроек
    └── fields/
        ├── RangeFields.ts
        └── CountdownFields.ts
```

## Соглашения

- Отступы: 4 пробела
- Кавычки: одинарные
- Точки с запятой: обязательны
- Tail comma в объектах/массивах
- Максимальная ширина строки: 100 символов
- Имена файлов: PascalCase для классов, camelCase для утилит

## Тесты

- Тесты находятся рядом с тестируемым файлом: `src/utils.test.ts`
- Покрываются только чистые функции с бизнес-логикой (utils.ts)
- UI-компоненты (WorkdayView, SettingsTab, модалки) не покрываются — они зависят от Obsidian API
- Фреймворк: Vitest

## Сборка

- esbuild собирает `src/main.ts` → `dist/main.js`
- `manifest.json` и `styles.css` копируются в `dist/` автоматически
- Папка `dist/` игнорируется в git
