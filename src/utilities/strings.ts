/**
 * Renders a time given into the format `mm:ss`
 * @param duration {number} Milliseconds
 * @param options {object} Interface for optional option values
 * @param options.secondPrecision {number} Optional value for number of decimal places to format seconds values to
 * @param options.hideMinutesIfZero {boolean} Optional value for whether the return string should hide minutes (and only return ss.##s for values less than 1 minute).  Defaults to false (always show minutes)
 * @return {string} Formatted duration
 */
export function formatDuration(duration: number, options: {
		secondPrecision?: number,
		hideMinutesIfZero: boolean,
	} = {secondPrecision: undefined, hideMinutesIfZero: false}): string {
	/* tslint:disable:no-magic-numbers */
	duration /= 1000

	const defaultSecondPrecision = duration < 10 ? 2 : 0
	const precision = options.secondPrecision != null ? options.secondPrecision : defaultSecondPrecision

	const minutesFormatter = new Intl.NumberFormat(
		undefined,
		{
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
			useGrouping: false,
		},
	)
	if (duration < 0)
	{
		return '< 0s'
	}

	const seconds = duration % 60
	const minutes = Math.floor(duration / 60)
	if (minutes === 0 && options.hideMinutesIfZero) {
		const secondsFormatter = new Intl.NumberFormat(undefined, {minimumIntegerDigits: 1, maximumFractionDigits: precision})
		return `${secondsFormatter.format(seconds)}s`
	} else {
		const secondsFormatter = new Intl.NumberFormat(undefined, {minimumIntegerDigits: 2, maximumFractionDigits: precision})
		return `${minutesFormatter.format(minutes)}:${secondsFormatter.format(seconds)}`
	}
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
