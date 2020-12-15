/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

const path = require('path');
const {
	container: {ModuleFederationPlugin},
} = require('webpack');

const createTempFile = require('./createTempFile');
const getMergedConfig = require('./getMergedConfig');
const parseBnd = require('./parseBnd');

const CORE_REMOTES = ['frontend-js-react-web', 'frontend-taglib-clay'];
const CORE_SHARES = [
	'@clayui/icon',
	'classnames',
	'formik',
	'prop-types',
	'react',
	'react-dnd',
	'react-dnd-html5-backend',
	'react-dom',
];

const BABEL_CONFIG = getMergedConfig('babel');

/**
 * Modify an existing webpack config to conform to Liferay standards.
 *
 * @param {object|Array|undefined} webpackConfig
 * @param {object} federation
 * Federation configuration, which can contain:
 *   - main: entry point for federation support (by default the value inside the
 *         `main` field of the `package.json` file is used).
 *
 * @return {object|Array} the tweaked webpack config
 */
function tweakWebpackConfig(webpackConfig, {federation} = {}) {
	let arrayConfig;

	if (!webpackConfig) {
		arrayConfig = [];
	}
	else if (Array.isArray(webpackConfig)) {
		arrayConfig = webpackConfig;
	}
	else {
		arrayConfig = [webpackConfig];
	}

	if (federation) {
		arrayConfig.push(createFederationConfig(federation));
	}

	arrayConfig = arrayConfig.map((webpackConfig) =>
		mergeBabelLoaderOptions(webpackConfig)
	);

	return arrayConfig.length === 1 ? arrayConfig[0] : arrayConfig;
}

/**
 * Create a webpack configuration to inject federation support to the build.
 *
 * Note that the default federation configuration exports the "main" entry point
 * as a federation module and makes it available through Liferay DXP.
 *
 * @param {object} federation
 * Federation configuration, which can contain:
 *   - main: entry point for federation support (by default the value inside the
 *         `main` field of the `package.json` file is used).
 *
 * @return {object} a webpack configuration
 */
function createFederationConfig(federation) {
	// eslint-disable-next-line @liferay/liferay/no-dynamic-require
	const packageJson = require(path.join(process.cwd(), 'package.json'));
	const bnd = parseBnd();

	const name = packageJson.name;
	const main = federation.main || packageJson.main || 'index.js';
	const webContextPath = bnd['Web-ContextPath'] || name;

	const {filePath: nullJsFilePath} = createTempFile('null.js', '');

	return {
		context: process.cwd(),
		devtool: 'source-map',
		entry: nullJsFilePath,
		module: {
			rules: [
				{
					exclude: /node_modules/,
					test: /\.js$/,
					use: {
						loader: 'babel-loader',
						options: {
							plugins: [
								'@babel/plugin-proposal-class-properties',
							],
							presets: ['@babel/preset-react'],
						},
					},
				},
				{
					exclude: /node_modules/,
					test: /\.scss$/,
					use: ['style-loader', 'css-loader', 'sass-loader'],
				},
			],
		},
		output: {
			filename: 'main.bundle.js',
			path: path.resolve(
				'./build/node/packageRunBuild/resources/__generated__'
			),
			publicPath: `/o${webContextPath}/__generated__/`,
		},
		plugins: [
			new ModuleFederationPlugin({
				exposes: {
					'.': `./src/main/resources/META-INF/resources/${main}`,
				},
				filename: 'container.js',
				library: {
					name: `window[Symbol.for("__LIFERAY_WEBPACK_CONTAINERS__")]["${name}"]`,
					type: 'assign',
				},
				name,
				remoteType: 'script',
				remotes: CORE_REMOTES.reduce((remotes, name) => {
					remotes[
						name
					] = `window[Symbol.for("__LIFERAY_WEBPACK_CONTAINERS__")]["${name}"]@/o/${name}/__generated__/container.js`;

					return remotes;
				}, {}),
				shared: CORE_SHARES.reduce((shared, name) => {
					shared[name] = {singleton: true};

					return shared;
				}, {}),
			}),
		],
	};
}

/**
 * Modify all babel-loader options so that they include our defaults.
 *
 * @param {object} webpackConfig
 * the object which has been exported from the webpack.config.js file
 */
function mergeBabelLoaderOptions(webpackConfig) {
	if (!webpackConfig.module) {
		return webpackConfig;
	}

	if (!webpackConfig.module.rules) {
		return webpackConfig;
	}

	return {
		...webpackConfig,
		module: {
			...webpackConfig.module,
			rules: webpackConfig.module.rules.map((rule) => {
				const {use} = rule;

				if (!use) {
					return rule;
				}

				const mergeUseEntry = (useEntry) => {
					if (useEntry === 'babel-loader') {
						return {
							loader: useEntry,
							options: {...BABEL_CONFIG},
						};
					}
					else if (useEntry.loader === 'babel-loader') {
						return {
							...useEntry,
							options: {...BABEL_CONFIG, ...useEntry.options},
						};
					}

					return useEntry;
				};

				return {
					...rule,
					use: Array.isArray(use)
						? use.map((useEntry) => mergeUseEntry(useEntry))
						: mergeUseEntry(use),
				};
			}),
		},
	};
}

module.exports = tweakWebpackConfig;