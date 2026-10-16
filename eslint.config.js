import css from '@eslint/css';

export default [
  {
    files: ['src/styles.css'],
    language: 'css/css',
    plugins: { css },
    rules: {
      'css/use-baseline': ['error', { available: 'newly' }],
    },
  },
];
