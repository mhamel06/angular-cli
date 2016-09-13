import * as path from 'path';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
import * as webpack from 'webpack';
import * as autoprefixer from 'autoprefixer';
const atl = require('awesome-typescript-loader');

import { BaseHrefWebpackPlugin } from '@angular-cli/base-href-webpack';
import { findLazyModules } from './find-lazy-modules';
const Visualizer = require('webpack-visualizer-plugin');

export function getWebpackCommonConfig(
  projectRoot: string,
  environment: string,
  appConfig: any,
  baseHref: string
) {

  const appRoot = path.resolve(projectRoot, appConfig.root);
  const appMain = path.resolve(appRoot, appConfig.main);
  const styles = appConfig.styles
               ? appConfig.styles.map((style: string) => path.resolve(appRoot, style))
               : [];
  const scripts = appConfig.scripts
                ? appConfig.scripts.map((script: string) => path.resolve(appRoot, script))
                : [];
  const lazyModules = findLazyModules(appRoot);

  let entry: { [key: string]: string[] } = {
    main: [appMain]
  };
const METADATA = {
  title: 'My App',
  baseUrl: '/'
};
  // Only add styles/scripts if there's actually entries there
  if (appConfig.styles.length > 0) { entry['styles'] = styles; }
  if (appConfig.scripts.length > 0) { entry['scripts'] = scripts; }

  return {
    devtool: 'source-map',
    resolve: {
      extensions: ['', '.ts', '.js'],
      root: appRoot
    },
    context: path.resolve(__dirname, './'),
    entry: entry,
    metadata: METADATA,
    isNative: false,
    output: {
      path: path.resolve(projectRoot, appConfig.outDir),
      filename: '[name].bundle.js'
    },
    module: {
      preLoaders: [
        {
          test: /(systemjs_component_resolver|system_js_ng_module_factory_loader)\.js$/,
          loader: 'string-replace-loader',
          query: {
            search: '(lang_1(.*[\\n\\r]\\s*\\.|\\.))?(global(.*[\\n\\r]\\s*\\.|\\.))?(System|SystemJS)(.*[\\n\\r]\\s*\\.|\\.)import',
            replace: 'System.import',
            flags: 'g'
          }
        },
        {
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: [
            /node_modules/
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
        },
        {
          test: /.component.ts$/,
          loader: 'string-replace-loader',
          query: {
            search: 'component.css',
            replace: 'component.scss',
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
                tsconfig: path.resolve(appRoot, appConfig.tsconfig)
              }
            }, {
              loader: 'angular2-template-loader'
            }
          ],
          exclude: [/\.(spec|e2e)\.ts$/]
        },

        // in main, load css as raw text
        {
          exclude: styles,
          test: /\.css/,
          loaders: ['raw-loader', 'postcss-loader']
        }, {
          exclude: styles,
          test: /\.styl$/,
          loaders: ['raw-loader', 'postcss-loader', 'stylus-loader'] },
        {
          exclude: styles,
          test: /\.less$/,
          loaders: ['raw-loader', 'postcss-loader', 'less-loader']
        }, {
          exclude: styles,
          test: /\.scss$|\.sass$/,
          loaders: ['raw-loader', 'postcss-loader', 'sass-loader']
        },

        // outside of main, load it via style-loader
        {
          include: styles,
          test: /\.css$/,
          loaders: ['style-loader', 'css-loader', 'postcss-loader']
        }, {
          include: styles,
          test: /\.styl$/,
          loaders: ['style-loader', 'css-loader', 'postcss-loader', 'stylus-loader']
        }, {
          include: styles,
          test: /\.less$/,
          loaders: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader']
        }, {
          include: styles,
          test: /\.scss$|\.sass$/,
          loaders: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
        },

        // load global scripts using script-loader
        { include: scripts, test: /\.js$/, loader: 'script-loader' },

        { test: /\.json$/, loader: 'json-loader' },

        { test: /\.(jpg|png|gif)$/, loader: 'url-loader?limit=10000' },
        { test: /\.html$/, loader: 'raw-loader', exclude: [path.resolve(appRoot, appConfig.index)] },

        { test: /\.(woff|ttf|svg)$/, loader: 'url?limit=10000' },
        { test: /\.woff2$/, loader: 'url?limit=10000&mimetype=font/woff2' },
        { test: /\.eot$/, loader: 'file' }
      ]
    },
    postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
    plugins: [
      // new webpack.ContextReplacementPlugin(
      //   /angular\/core\/(esm\/src|src)\/linker/,
      //   path.resolve(appRoot,,
      //   resolveNgRoute(path.resolve(projectRoot, `./${sourceDir}/`))
      // ),
      new webpack.ContextReplacementPlugin(/.*/, appRoot, lazyModules),
      new atl.ForkCheckerPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(appRoot, appConfig.index),
        chunksSortMode: 'dependency'
      }),
      new BaseHrefWebpackPlugin({
        baseHref: baseHref
      }),
      new webpack.NormalModuleReplacementPlugin(
        // This plugin is responsible for swapping the environment files.
        // Since it takes a RegExp as first parameter, we need to escape the path.
        // See https://webpack.github.io/docs/list-of-plugins.html#normalmodulereplacementplugin
        new RegExp(path.resolve(appRoot, appConfig.environments['source'])
          .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')),
        path.resolve(appRoot, appConfig.environments[environment])
      ),
      new webpack.optimize.CommonsChunkPlugin({
        // Optimizing ensures loading order in index.html
        name: ['styles', 'scripts', 'main'].reverse()
      }),
      new webpack.optimize.CommonsChunkPlugin({
        minChunks: Infinity,
        name: 'inline',
        filename: 'inline.js',
        sourceMapFilename: 'inline.map'
      }),
      new CopyWebpackPlugin([{
        context: path.resolve(appRoot, appConfig.assets),
        from: { glob: '**/*', dot: true },
        ignore: [ '.gitkeep' ],
        to: path.resolve(projectRoot, appConfig.outDir, appConfig.assets)
      }]),
      new Visualizer({
        filename: '../statistics.html'
      })

    ],
    node: {
      fs: 'empty',
      global: 'window',
      crypto: 'empty',
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  };
}
