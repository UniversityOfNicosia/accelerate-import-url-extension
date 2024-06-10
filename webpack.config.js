const path = require('path');
const webpack = require('webpack');
// const dotenv = require('dotenv');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  // // Load environment variables from .env file
  // const envConfig = dotenv.config().parsed;
  //
  // // Convert environment variables to be used in DefinePlugin
  // const envKeys = Object.keys(envConfig).reduce((prev, next) => {
  //   prev[`process.env.${next}`] = JSON.stringify(envConfig[next]);
  //   return prev;
  // }, {});

  return {
    entry: {
      popup: './src/popup.js',
      background: './src/background.js',
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist')
    },
    devtool: 'source-map', // Enable source maps
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/manifest.json', to: 'manifest.json' },
          { from: 'src/popup.html', to: 'popup.html' },
          { from: 'src/popup.css', to: 'popup.css' },
          { from: 'src/icons', to: 'icons' },
        ],
      }),
    ],
    // Add other configurations as needed
  };
};
