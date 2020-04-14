const assign = require('object-assign');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const devHost = 'localhost';
const port = '8090';

module.exports = (env, argv) => {

    const isProduction = argv.mode === 'production' ? true : false;

    const bundles = {
        'mapstore-covid-us': path.join(__dirname, 'js', 'app')
    };
    const themeEntries = {
        'themes/default': path.join(__dirname, 'themes', 'default', 'theme.less')
    };

    const paths = {
        base: __dirname,
        dist: path.join(__dirname, 'dist'),
        framework: path.join(__dirname, 'MapStore2', 'web', 'client'),
        code: [
            path.join(__dirname, 'js'),
            path.join(__dirname, 'MapStore2', 'web', 'client'),
            path.join(__dirname, 'node_modules', '@terrestris', 'base-util', 'node_modules'),
            path.join(__dirname, 'node_modules', 'query-string'),
            path.join(__dirname, 'node_modules', 'strict-uri-encode'),
            path.join(__dirname, 'node_modules', 'split-on-first')
        ]
    };
    const publicPath = isProduction ? 'dist/' : 'http://localhost:8090/';
    const cssPrefix = '.mapstore-covid-us';

    return {
        entry: assign(isProduction
            ? {}
            : {
                'webpack-dev-server': `webpack-dev-server/client?http://0.0.0.0:${port}`, // WebpackDevServer host and port
                'webpack': 'webpack/hot/only-dev-server' // 'only' prevents reload on syntax errors
            }, bundles, themeEntries),
        output: {
            path: paths.dist,
            publicPath,
            filename: '[name].[hash].js',
            chunkFilename: isProduction ? '[name].[hash].chunk.js' : '[name].js'
        },
        plugins: [
            new LoaderOptionsPlugin({
                debug: !isProduction,
                options: {
                    postcss: {
                        plugins: [
                            require('postcss-prefix-selector')({prefix: cssPrefix, exclude: ['.ms2', cssPrefix, '[data-ms2-container]']})
                        ]
                    },
                    context: paths.base
                }
            }),
            new DefinePlugin({
                '__DEVTOOLS__': !isProduction,
                "__MS_VERSION__": `"${Date.now()}"`
            }),
            new DefinePlugin({
                'process.env': {
                    'NODE_ENV': isProduction ? '"production"' : '""'
                }
            }),
            new NormalModuleReplacementPlugin(/leaflet$/, path.join(paths.framework, 'libs', 'leaflet')),
            new NormalModuleReplacementPlugin(/proj4$/, path.join(paths.framework, 'libs', 'proj4')),
            new NormalModuleReplacementPlugin(/proj4$/, path.join(paths.framework, 'libs', 'proj4')),
            new NoEmitOnErrorsPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].[hash].css'
            }),
            new HtmlWebpackPlugin({
                inject: false,
                template: path.resolve(__dirname, 'index.ejs')
            })
        ],
        resolve: {
            extensions: ['.js', '.jsx'],
            alias: {
                '@mapstore': path.resolve(__dirname, 'MapStore2/web/client'),
                '@js': path.resolve(__dirname, "js"),
                'jsonix': '@boundlessgeo/jsonix',
                // next libs are added because of this issue https://github.com/geosolutions-it/MapStore2/issues/4569
                'proj4': '@geosolutions/proj4',
                'react-joyride': '@geosolutions/react-joyride'
            }
        },
        module: {
            noParse: [/html2canvas/],
            rules: [
                {
                    test: /\.css$/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader'
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('postcss-prefix-selector')({ prefix: cssPrefix || '.ms2', exclude: ['.ms2', '[data-ms2-container]'].concat(cssPrefix ? [cssPrefix] : []) })
                            ]
                        }
                    }]
                },
                {
                    test: /\.less$/,
                    exclude: /themes[\\\/]?.+\.less$/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader'
                    }, {
                        loader: 'less-loader'
                    }]
                },
                {
                    test: /themes[\\\/]?.+\.less$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader', {
                            loader: 'postcss-loader',
                            options: {
                                plugins: [
                                    require('postcss-prefix-selector')({ prefix: cssPrefix || '.ms2', exclude: ['.ms2', '[data-ms2-container]'].concat(cssPrefix ? [cssPrefix] : []) })
                                ]
                            }
                        }, 'less-loader'
                    ]
                },
                {
                    test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            mimetype: 'application/font-woff'
                        }
                    }]
                },
                {
                    test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]'
                        }
                    }]
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            name: '[path][name].[ext]',
                            limit: 8192
                        }
                    }] // inline base64 URLs for <=8k images, direct URLs for the rest
                },
                {
                    test: /\.jsx?$/,
                    exclude: /(ol\.js)$|(Cesium\.js)$/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            configFile: path.join(__dirname, 'babel.config.js')
                        }
                    }],
                    include: paths.code
                }
            ].concat(isProduction ? [{
                test: /\.html$/,
                loader: 'html-loader'
            }] : [])
        },
        devServer: isProduction ? undefined : {
            port: port,
            host: devHost
        },
        devtool: !isProduction ? 'eval' : undefined
    };
};
