import {CleanWebpackPlugin} from 'clean-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import webpack from 'webpack'
import {getReactAppEnvironment} from './config/environment'
import indexMetadata from './config/indexMetadata.json'
import {calculateLocaleCompletion} from './config/locale'

import './config/loadDotenv'

interface Environment {
	[key: string]: unknown
}

interface Arguments {
	mode: 'production' | 'development'
	[key: string]: unknown
}

export default (env: Environment, argv: Arguments): webpack.Configuration => ({
	entry: {index: './src/index'},
	output: {
		path: path.resolve(__dirname, 'build'),
		publicPath: '/',
		filename: 'assets/[name].[contenthash:8].js',
	},

	resolve: {
		extensions: [
			'.ts',
			'.tsx',
			'.js',
			'.jsx',
			'.json',
		],
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
	},

	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
				PUBLIC_URL: JSON.stringify(''),
				LOCALE_COMPLETION: calculateLocaleCompletion(),
				...getReactAppEnvironment(),
			}
		}),

		new HtmlWebpackPlugin({
			// Cribbed template from neutrino
			template: './config/template.ejs',
			appMountId: 'root',
			filename: 'index.html',
			chunks: ['index'],
			// Doesn't even know what it supports smh
			...(indexMetadata as any),
		}),
		new CopyWebpackPlugin({
			patterns: ['public'],
		}),
		new MiniCssExtractPlugin({
			filename: 'assets/[name].[contenthash:8].css',
		}),
		new CleanWebpackPlugin(),
	],

	module: {
		rules: [{
			// JS/TS (via babel)
			test: /\.[tj]sx?$/,
			include: [
				path.resolve(__dirname, 'src'),
			],
			use: [{
				loader: 'babel-loader',
				options: {
					cacheDirectory: true,
					envName: argv.mode,
				},
			}],
		}, {
			// CSS
			test: /\.css$/,
			use: [{
				loader: MiniCssExtractPlugin.loader,
				options: {esModule: true},
			}, {
				loader: 'css-loader',
				options: {
					modules: {
						auto: true,
						// TODO: Switch this to `[hash:base64]` in prod?
						localIdentName: '[name]_[local]__[md5:hash:base64:5]',
						// TODO: camelCaseOnly?
						exportLocalsConvention: 'camelCase',
					},
				}
			}],
		}, {
			// Lingui message files
			test: /locale.+\.json$/,
			type: 'javascript/auto',
			use: [{
				loader: '@lingui/loader',
			}]
		}, {
			// Fonts
			test: /\.(eot|ttf|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
			use: [{
				loader: 'file-loader',
				options: {
					name: 'assets/[name].[hash:8].[ext]',
				},
			}],
		}, {
			// Images
			test: /\.(ico|png|jpg|jpeg|gif|svg|webp)(\?v=\d+\.\d+\.\d+)?$/,
			use: [{
				loader: 'url-loader',
				options: {
					limit: 8192,
					name: 'assets/[name].[hash:8].[ext]',
					// TODO: ?
					// esModule: false,
				}
			}]
		}],
	},

	// TODO: mode
	// TODO: devtool
	// TODO: target
	// TODO: context
	// TODO: stats
	// TODO: node?
	// TODO: optimization
})
