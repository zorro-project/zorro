module.exports = {
  extends: ['@redwoodjs/eslint-config'],
  rules: {
    'react/no-unescaped-entities': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'prettier/prettier': 'error',
  },
}
