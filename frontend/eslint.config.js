import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Catches <img> with missing alt at dev time — prevents accessibility and SEO regressions.
      'jsx-a11y/alt-text': 'error',
    },
  },
  // Prevent section components from defining <h1>. Only Hero and Success section
  // files may render the page-level H1; everything else must use <h2> or lower.
  {
    files: ['src/sections/**/*.{ts,tsx}'],
    ignores: ['src/sections/**/*Hero*', 'src/sections/**/*Success*'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="h1"]',
          message:
            'Section components must not define <h1>. Each page already has exactly one H1 in its Hero or page component. Use <h2> or lower here.',
        },
      ],
    },
  },
)
