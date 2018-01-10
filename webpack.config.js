const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
      main: './app/js/index.js', // where the bundler starts the bundling process
      calc: './app/js/calc.js',
    },
    output: { // where the bundled code is saved
        path: path.resolve('dist'),
         filename: '[name]_bundle.js'
    },
    resolve: {
        alias: {
          jquery: path.resolve(__dirname, 'node_modules/jquery/src/jquery'),
            semantic: path.resolve(__dirname, 'semantic/src/'),
            lib: path.resolve(__dirname, 'lib/'),
            style: path.resolve(__dirname, 'app/style/'),
            img: path.resolve(__dirname, 'app/img/'),
            typed: path.resolve(__dirname, 'app/js/typed/'),
            highcharts: path.resolve(__dirname, 'node_modules/highcharts/'),
        }
    },
    module: {
        loaders: [
            {
                test: /\.(png|gif)$/,
                loader: 'url-loader?limit=1024&name=[name]-[hash:8].[ext]!image-webpack-loader'
            },
            {
                test: /\.jpg$/,
                loader: 'file-loader'
            },
            {
                test: /\.less$/, // import css from 'foo.less';
                use: [
                    'style-loader',
                    {
                      loader: 'css-loader',
                      options: {minimize: true}
                    },
                    'less-loader'
                ]
            },
            {
               test: /\.ts?$/,
               loader: 'ts-loader'
            },
            {
                test: /\.(ttf|eot|svg|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader'
            }
        ]
    },
    devtool: 'eval-source-map',
    devServer: { compress: true },
    plugins: [
        new webpack.ProvidePlugin({
           $: 'jquery',
           jQuery: 'jquery',
           'window.jQuery': 'jquery',
       }),
        new HtmlWebpackPlugin({
            template: './app/index.html',
            filename: 'index.html',
            inject: 'body' // inject scripts before closing body tag
        }),
        new HtmlWebpackPlugin({
            template: './app/calc.html',
            filename: 'calc.html',
            inject: 'body' // inject scripts before closing body tag
        })
    ]
};
