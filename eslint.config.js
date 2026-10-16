import css from '@eslint/css';

export default [
  {
    files: ['styles.css'],
    language: 'css/css',
    plugins: { css },
    rules: {
      'css/use-baseline': ['error', { available: 'newly' }],
    },
  },
];
