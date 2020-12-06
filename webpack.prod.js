const path = require('path');
const webpackMerge = require('webpack-merge');

const baseConfig = require('./webpack.config');

/**
 *
 *
 * @param   {object} _
 * @param   {object} options
 * @returns {object}
 */
function webpackConfig(_, options) {
  const config = {
    mode: 'production',
    watch: false,
    devtool: false,
  };

  return webpackMerge(baseConfig, config);
}

module.exports = webpackConfig;
