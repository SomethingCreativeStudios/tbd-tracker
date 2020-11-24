const webpack = require('webpack');
const glob = require('glob');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
const StartServerPlugin = require('start-server-webpack-plugin');

function TimeFixPlugin() {
  this.apply = function(compiler) {
    var timefix = 11000;
    compiler.plugin('watch-run', (watching, callback) => {
      watching.startTime += timefix;
      callback();
    });
    compiler.plugin('done', stats => {
      stats.startTime -= timefix;
    });
  };
}
const migrations = glob.sync(path.resolve('src/migrations/*.ts')).reduce((entries, filename) => {
  const migrationName = path.basename(filename, '.ts');
  return Object.assign({}, entries, {
    [`migrations/${migrationName}`]: filename,
  });
}, {});

module.exports = options => {
  return {
    entry: {
      ...migrations,
      server: ['webpack/hot/poll?100', './src/main.ts'],
    },
    watch: true,
    target: 'node',
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100', 'typeorm'],
      }),
    ],
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: {
            loader: 'ts-loader',
          },
          exclude: [/node_modules/],
        },
      ],
    },
    optimization: {
      minimize: false,
    },
    mode: 'development',
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new TimeFixPlugin(),
      new CleanWebpackPlugin([path.resolve(__dirname, './dist')], {
        exclude: ['dist'],
      }),
      new FilterWarningsPlugin({
        exclude: [
          /mongodb/,
          /mssql/,
          /mysql/,
          /mysql2/,
          /oracledb/,
          /pg/,
          /pg-native/,
          /pg-query-stream/,
          /react-native-sqlite-storage/,
          /redis/,
          /sqlite3/,
          /sql.js/,
          /typeorm-aurora-data-api-driver/,
        ],
      }),
      //  new StartServerPlugin({ name: 'server.js' }),
    ],
    output: {
      libraryTarget: 'umd',
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
    },
  };
};
