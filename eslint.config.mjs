import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

  export default [
    { ignores: ['node_modules/**','dist/**','.next/**','coverage/**','android/**','ios/**','**/*.js','!eslint.config.mjs'] },
    {
      files: ['**/*.ts','**/*.tsx'],
      languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: 'module', project: true } },
      plugins: { '@typescript-eslint': tsPlugin, import: importPlugin },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error',{ argsIgnorePattern:'^_', varsIgnorePattern:'^_' }],
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        'import/order': ['error',{ groups:['builtin','external','internal','parent','sibling','index'],'newlines-between':'always', alphabetize:{   
  order:'asc', caseInsensitive:true } }],
        'import/no-duplicates': 'error',
        'no-console': ['warn',{ allow:['warn','error'] }],
        'prefer-const': 'error',
        'no-var': 'error',
      },
    },
  ];