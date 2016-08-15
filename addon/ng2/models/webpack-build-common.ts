import * as path from 'path';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as webpack from 'webpack';
import { ContextReplacementPlugin } from 'webpack';
import { ForkCheckerPlugin } from 'awesome-typescript-loader';
import { CliConfig } from './config';
import * as autoprefixer from 'autoprefixer';
import 'core-js/es6';
import 'core-js/es7/reflect';
import 'ts-helpers';

const resolveNgRoute = require('@angularclass/resolve-angular-routes')

export function getWebpackCommonConfig(projectRoot: string, sourceDir: string) {
  return {
    devtool: 'source-map',
    resolve: {
      extensions: ['', '.ts', '.js'],
      root: path.resolve(projectRoot, `./${sourceDir}`)
    },
    context: path.resolve(__dirname, './'),
    entry: {
      main: [path.resolve(projectRoot, `./${sourceDir}/main.ts`)],
      polyfills: path.resolve(projectRoot, `./${sourceDir}/polyfills.ts`)
    },
    output: {
      path: path.resolve(projectRoot, './dist'),
      filename: '[name].bundle.js'
    },
    module: {
      preLoaders: [
        // {
        //   test: /(systemjs_component_resolver|system_js_ng_module_factory_loader)\.js$/,
        //   loader: 'string-replace-loader',
        //   query: {
        //     search: '(lang_1(.*[\\n\\r]\\s*\\.|\\.))?(global(.*[\\n\\r]\\s*\\.|\\.))?(System|SystemJS)(.*[\\n\\r]\\s*\\.|\\.)import',
        //     replace: 'System.import',
        //     flags: 'g'
        //   }
        // },
        {
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: [
            path.resolve(projectRoot, 'node_modules/@ngrx'),
            path.resolve(projectRoot, 'node_modules/rxjs'),
            path.resolve(projectRoot, 'node_modules/@angular'),
          ]
        },
        {
          test: /.js$/,
          loader: 'string-replace-loader',
          query: {
            search: 'moduleId: module.id,',
            replace: '',
            flags: 'g'
          }
        }
      ],
      loaders: [
        {
          test: /\.ts$/,
          loaders: [
            {
              loader: 'awesome-typescript-loader',
              query: {
                useForkChecker: true,
                tsconfig: path.resolve(projectRoot, `./${sourceDir}/tsconfig.json`)
              }
            },
            {
              loader: 'angular2-template-loader'
            }
          ],
          exclude: [/\.(spec|e2e)\.ts$/]
        },
        { test: /\.json$/, loader: 'json-loader'},
        { test: /\.css$/,  loaders: ['raw-loader', 'postcss-loader'] },
        { test: /\.styl$/, loaders: ['raw-loader', 'postcss-loader', 'stylus-loader'] },
        { test: /\.less$/, loaders: ['raw-loader', 'postcss-loader', 'less-loader'] },
        { test: /\.scss$|\.sass$/, loaders: ['raw-loader', 'postcss-loader', 'sass-loader'] },
        { test: /\.(jpg|png)$/, loader: 'url-loader?limit=128000'},
        { test: /\.html$/, loader: 'raw-loader' }
      ]
    },
    postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
    plugins: [
      new ContextReplacementPlugin(
        /angular\/core\/(esm\/src|src)\/linker/,
        path.resolve(projectRoot, `./${sourceDir}/`),
        resolveNgRoute(path.resolve(projectRoot, `./${sourceDir}/`))
      ),
      new ForkCheckerPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(projectRoot, `./${sourceDir}/index.html`),
        chunksSortMode: 'dependency'
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: ['polyfills']
      }),
      new webpack.optimize.CommonsChunkPlugin({
        minChunks: Infinity,
        name: 'inline',
        filename: 'inline.js',
        sourceMapFilename: 'inline.map'
      }),
      new CopyWebpackPlugin([{
        context: path.resolve(projectRoot, './public'),
        from: '**/*',
        to: path.resolve(projectRoot, './dist')
      }])
    ],
    node: {
      fs: 'empty',
      global: 'window',
      crypto: 'empty',
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  }
};
