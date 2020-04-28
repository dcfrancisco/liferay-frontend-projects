/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import project from 'liferay-npm-build-tools-common/lib/project';

import {buildBundlerDir} from '../../../dirs';
import * as log from '../../../log';
import {copyFiles} from '../../../util/files';
import {runPkgJsonScript} from '../../../util/run';
import {renderTemplates, wrapWebpackBundles} from '../index';

/**
 * Run configured rules.
 */
export default async function adaptCreateReactApp(): Promise<void> {
	log.info(`Running React's build...`);

	runPkgJsonScript('build');

	log.info('Rendering adapter modules...');

	await renderTemplates();

	log.info('Copying static assets...');

	copyStaticAssets();

	log.info('Wrapping webpack bundles into AMD definitions...');

	await wrapWebpackBundles();
}

function copyStaticAssets(): void {
	const copiedFiles = copyFiles(
		project.dir.join(project.adapt.buildDir),
		['static/css/*', 'static/media/*'],
		buildBundlerDir
	);

	log.debug(`Copied ${copiedFiles.length} static assets`);
}
