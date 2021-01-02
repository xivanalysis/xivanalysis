import * as path from 'path'
import * as webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

interface Environment {
	[key: string]: unknown
}

interface Arguments {
	mode: 'production' | 'development'
	[key: string]: unknown
}

export default (env: Environment, argv: Arguments): webpack.Configuration => ({
	entry: './src/index',
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
		fallback: {
			path: require.resolve('path-browserify')
		},
	},

	plugins: [
		new MiniCssExtractPlugin({
			filename: 'assets/[name].[contenthash:8].css',
		}),
	],

	module: {
		rules: [{
			// JS/TS (via babel)
			test: /\.[tj]sx?$/,
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
