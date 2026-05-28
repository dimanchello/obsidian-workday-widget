import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: ['dist/', 'node_modules/', 'main.js'],
    },
    eslint.configs.recommended,
    prettier,
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ['src/**/*.ts'],
        extends: [
            ...tseslint.configs.recommendedTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                project: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
        },
    },
);
