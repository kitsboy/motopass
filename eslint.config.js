import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'website/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // React Compiler diagnostic, not a correctness rule: this build does NOT enable
      // the compiler (no babel-plugin-react-compiler in vite.config.ts), so "Existing
      // memoization could not be preserved" (GoalFinder's manual useMemo over program
      // data) is an advisory that would only matter once the compiler is switched on.
      // Keep it visible as a warning; promote it back to error together with the compiler.
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
)