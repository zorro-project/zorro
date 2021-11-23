module.exports = (config) => {
  // Workaround to import typescript from the API side
  // https://github.com/redwoodjs/redwood/issues/531#issuecomment-848608430
  config.module.rules.forEach((rule) => {
    ;(rule.oneOf || []).forEach((oneOfRule) => {
      if (Array.isArray(oneOfRule.use)) {
        oneOfRule.use
          .filter((use) => use.loader === 'babel-loader')
          .forEach((use) => {
            applyBabelLoaderConfig(use.options) // found babel loader? apply code below
          })
      }
    })
  })
  function applyBabelLoaderConfig(options) {
    options.babelrcRoots = ['.', '../api']
  }

  return config
}
