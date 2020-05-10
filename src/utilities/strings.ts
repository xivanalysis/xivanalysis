import _ from 'lodash'

/**
 * Renders a time given into the format `mm:ss`
 * @param duration {number} Milliseconds
 * @param options {object} Interface for optional option values
 * @param options.secondPrecision {number} Optional value for number of decimal places to format seconds values to
 * @param options.hideMinutesIfZero {boolean} Value for whether the return string should hide minutes (and only return ss.##s for values less than 1 minute).  Defaults to false (always show minutes)
 * @param options.showNegative {boolean} Optional value for whether the return string should show a negative number.  Will return '< 0s' for negative numbers if this is false or undefined
 * @return {string} Formatted duration
 */
export function formatDuration(duration: number, options: {
		secondPrecision?: number,
		hideMinutesIfZero?: boolean,
		showNegative?: boolean,
	} = {}): string {
	if (duration == null || isNaN(duration)) {
		throw Error('A non-numeric value was supplied to formatDuration')
	}
	/* tslint:disable:no-magic-numbers */
	duration /= 1000

	const defaultSecondPrecision = duration < 10 ? 2 : 0
	const precision = options.secondPrecision != null ? options.secondPrecision : defaultSecondPrecision

	duration = _.round(duration, precision)

	const minutesFormatter = new Intl.NumberFormat(undefined, {minimumIntegerDigits: 2, maximumFractionDigits: 0, useGrouping: false})

	if (duration < 0 && !options.showNegative)
	{
		return '< 0s'
	}

	const seconds = duration % 60
	const minutes = (duration < 0) ? Math.ceil(duration / 60) : Math.floor(duration / 60)
	if (minutes === 0 && options.hideMinutesIfZero) {
		const secondsFormatter = new Intl.NumberFormat(undefined, {minimumIntegerDigits: 1, maximumFractionDigits: precision, minimumFractionDigits: precision})
		return `${secondsFormatter.format(seconds)}s`
	} else {
		const secondsFormatter = new Intl.NumberFormat(undefined, {minimumIntegerDigits: 2, maximumFractionDigits: precision, minimumFractionDigits: precision})
		return `${minutesFormatter.format(minutes)}:${secondsFormatter.format(Math.abs(seconds))}`
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
