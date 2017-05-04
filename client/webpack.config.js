var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var extractPlugin = new ExtractTextPlugin({
    filename: 'main.css'
});

var DIST_DIR = path.resolve(__dirname, 'dist');
var SRC_DIR = path.resolve(__dirname, 'src');

module.exports = {
    entry: [
        SRC_DIR + "/app/index.js"
    ],
    output: {
        path: DIST_DIR + '/app',
        filename: 'bundle.js',
        publicPath: '/app/'
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: extractPlugin.extract({
                    // loader的解析顺序是倒序的，顺序是 less -> css
                    use: ['css-loader', 'less-loader']
                })
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015', 'stage-2', 'stage-3']
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        extractPlugin
    ]
}