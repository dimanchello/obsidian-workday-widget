import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        ignores: ['dist/', 'node_modules/', 'main.js'],
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
);
