const path = require('path');

module.exports = function karmaConfig(config) {
    config.set(require('./MapStore2/build/testConfig')({
        files: [
            'tests.webpack.js'
        ],
        browsers: ['Chrome'],
        basePath: '.',
        path: [
            path.join(__dirname, 'js'),
            path.join(__dirname, 'MapStore2', 'web', 'client'),
            path.join(__dirname, 'node_modules', '@terrestris', 'base-util', 'node_modules'),
            path.join(__dirname, 'node_modules', 'query-string'),
            path.join(__dirname, 'node_modules', 'strict-uri-encode'),
            path.join(__dirname, 'node_modules', 'split-on-first')
        ],
        testFile: 'tests.webpack.js',
        singleRun: false,
        alias: {
            '@mapstore': path.resolve(__dirname, 'MapStore2/web/client'),
            '@js': path.resolve(__dirname, "js")
        }
    }));
};
