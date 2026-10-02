import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  { ignores: ['.next/**', 'dist/**', 'node_modules/**'] },
  {
    files: ['next.config.js', 'prisma/seed.js'],
    rules: {'@typescript-eslint/no-require-imports': 'off'}
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@next/next/no-page-custom-font': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn'
    }
  }
];

export default config;
