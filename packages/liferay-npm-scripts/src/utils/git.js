/**
 * © 2019 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

const {spawn} = require('cross-spawn');

/**
 * Convenience helper for running Git commands.
 */
function git(...args) {
	const command = `git ${args.join(' ')}`;

	const {error, signal, status, stdout} = spawn.sync('git', args);

	if (error) {
		throw error;
	}

	if (signal) {
		throw new Error(
			`git(): command \`${command}\` exited due to signal ${signal}`
		);
	}

	if (status) {
		throw new Error(
			`git(): command \`${command}\` exited with status ${status}`
		);
	}

	return stdout.toString().trim();
}

module.exports = git;