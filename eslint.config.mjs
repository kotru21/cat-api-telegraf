import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  prettierConfig,
  {
    ignores: ['dist/', 'node_modules/', 'public/', 'coverage/', 'src/web/public/dist/'],
  },
  {
    files: ['src/web/public/**/*.ts', 'src/web/public/**/*.js'],
    languageOptions: {
      globals: {
        ...eslint.configs.recommended.languageOptions?.globals,
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLImageElement: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        URLSearchParams: 'readonly',
        Image: 'readonly',
        requestAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly',
        history: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
      },
    },
  },
);
