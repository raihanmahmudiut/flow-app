import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        // Node globals (for tests)
        global: 'readonly',
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        vi: 'readonly',
      }
    },
    rules: {
      // Vue specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',
      
      // General rules - relaxed for existing codebase
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.config.js'
    ]
  }
]

