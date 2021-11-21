const config = require('@redwoodjs/testing/config/jest/web')

// Work around weird issues related to missing TextEncoder polyfill
// https://github.com/jsdom/jsdom/issues/2524#issuecomment-902027138
config.testEnvironment = 'jest-environment-node'

module.exports = config
