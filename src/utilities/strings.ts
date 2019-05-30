/**
 * Renders a time given into the format `mm:ss`
 * @param duration {number} Seconds
 * @return {string} Formatted duration
 */
export function formatDuration(duration: number): string {
	/* tslint:disable:no-magic-numbers */
	const formatter = new Intl.NumberFormat(
		undefined,
		{minimumIntegerDigits: 2, maximumFractionDigits: 0, useGrouping: false},
	)
	const seconds = Math.floor(duration % 60)
	const minutes = Math.floor(duration / 60)
	return `${formatter.format(minutes)}:${formatter.format(seconds)}`
	/* tslint:enable:no-magic-numbers */
}

/**
 * Get a slice of a string up until the first instance of a sub-string.
 * @param {String} haystack The string to slice
 * @param {String} needle The sub-string to search for
 * @returns {String} All of string before needle
 */
export function stringBefore(haystack: string, needle: string) {
	const idx = haystack.indexOf(needle)
	return idx === -1? haystack : haystack.slice(0, idx)
}
