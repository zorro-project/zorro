module.exports = {
  addons: ['@storybook/addon-essentials'],

  // Appears to speed up rebuild time https://github.com/storybookjs/storybook/issues/12585
  typescript: {reactDocgen: 'react-docgen'},
}
