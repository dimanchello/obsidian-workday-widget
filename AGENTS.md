# AGENTS.md

## Команды

```bash
npm run dev           # Режим разработки (watch)
npm run build         # Продакшн сборка в dist/
npm run lint          # Проверка линтером (строгие правила)
npm run lint:fix      # Автоисправление линтера
npm run format        # Форматирование кода
npm run format:check  # Проверка форматирования
npm run test          # Запуск unit тестов
npm run test:watch    # Тесты в режиме watch
npm run typecheck     # Проверка типов TypeScript
npm run knip          # Поиск мёртвого кода
npm run validate      # typecheck + lint + knip + format:check + test
```

## Правило: после любой доработки кода ОБЯЗАТЕЛЬНО запускать `npm run validate`

Валидация включает: typecheck (tsc), линтер (eslint со strict type-checked правилами), поиск мёртвого кода (knip), проверку форматирования (prettier), и все unit-тесты (vitest).

## Структура проекта

```
src/
├── main.ts                     # Точка входа, класс плагина
├── types.ts                    # TypeScript типы + PluginBridge
├── constants.ts                # Константы и дефолтные значения
├── utils.ts                    # Чистые утилиты (покрываются тестами)
├── utils.test.ts               # Тесты утилит
├── timerLogic.ts               # Фасад расчёта таймеров
├── timerLogic.test.ts          # Тесты расчёта таймеров
├── migrations.ts               # Миграция данных
├── migrations.test.ts          # Тесты миграции
├── i18n.ts                     # Интернационализация
├── i18n.test.ts                # Тесты интернационализации
├── notifications.ts            # Системные уведомления (Notice + Notification API)
├── notifications.test.ts       # Тесты уведомлений
├── integration.test.ts          # Интеграционные тесты жизненного цикла
├── services/
│   └── TimerEngine.ts          # Централизованный движок тиков и уведомлений
├── strategies/
│   ├── TimerStrategy.ts         # Интерфейс паттерна Strategy
│   ├── RangeTimerStrategy.ts    # Стратегия диапазонного таймера
│   ├── CountdownTimerStrategy.ts# Стратегия таймера обратного отсчёта
│   └── TimerStrategyFactory.ts  # Фабрика стратегий
├── modals/
│   └── ConfirmModal.ts         # Модалка подтверждения
├── views/
│   └── WorkdayView.ts          # Основной виджет (ItemView)
└── settings/
    ├── SettingsTab.ts          # Вкладка настроек
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
- Все type-only импорты: `import type { ... }`
- Non-null assertion (`!`) запрещён
- Строгая типизация: `no-explicit-any` — error

## Тесты

- Тесты находятся рядом с тестируемым файлом: `*.test.ts`
- Покрываются все чистые функции: utils.ts, timerLogic.ts, migrations.ts
- UI-компоненты (WorkdayView, SettingsTab, модалки) не покрываются — они зависят от Obsidian API
- Фреймворк: Vitest
- **Правило: после любой доработки кода — синхронизировать тесты с изменениями.** Новая или изменённая бизнес-логика должна быть покрыта тестами. Запуск `npm run validate` перед коммитом обязателен.

## Архитектура

- `PluginBridge` (types.ts) разрывает циклическую зависимость main ↔ view/settings
- Бизнес-логика таймеров (timerLogic.ts) отделена от DOM (WorkdayView.ts)
- Миграция данных вынесена в migrations.ts

## Сборка

- esbuild собирает `src/main.ts` → `dist/main.js`
- `manifest.json` и `styles.css` копируются в `dist/` автоматически
- Папка `dist/` игнорируется в git
