import {msg} from '@lingui/core/macro'
import {SearchHandlerResult, reportSources} from 'reportSources'

// Localhost is... a bit generous. But we'll let the rest of the app fail out on that for us.
const XIVA_URL_EXPRESSION = /(?:xivanalysis.com|(?:localhost|127.0.0.1)(?::\d+)?)\/(.+)/

export function parseInput(input: string): SearchHandlerResult {
	// Check if any report sources provide a matching search handler
	for (const source of reportSources) {
		if (source.searchHandlers == null) { continue }

		for (const handler of source.searchHandlers) {
			const match = handler.regexp.exec(input)
			if (match == null) { continue }

			const result = handler.handler(match.groups ?? {})

			if (!result.valid) { return result }

			return {
				valid: true,
				path: `${source.path}${result.path}`,
			}
		}
	}

	// No report source matches, check if it's a xiva link we can blindly copy
	const match = XIVA_URL_EXPRESSION.exec(input)
	if (match != null) {
		return {
			valid: true,
			path: match[1],
		}
	}

	return {
		valid: false,
		reason: msg({id: 'core.home.report-search.invalid-query', message: 'The provided query does not match any of the expected formats.'}),
	}
}
