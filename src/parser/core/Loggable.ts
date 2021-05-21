import {seededColor} from 'utilities/color'

// Helper types for debug
type LogParameters = Parameters<typeof console.log>
type DebugCallback = (opts: {
	/** Log the provided arguments. */
	log: (...data: LogParameters) => void,
}) => void

export abstract class Loggable {
	/**
<<<<<<< HEAD
	 * Set to `true` to enable debug mode for this loggable class, allowing the execution
=======
	 * Set to `true` to enable debug mode for this analyser, allowing the execution
>>>>>>> wip: change GCD estimation to Adapter step
	 * of any calls to the debug method.
	 */
	static debug = false

<<<<<<< HEAD
	/** Execute the provided callback if the loggable is in debug mode. */
	protected debug(callback: DebugCallback): void
	/** Log the provided arguments if the loggable is in debug mode. */
=======
	/** Execute the provided callback if the analyser is in debug mode. */
	protected debug(callback: DebugCallback): void
	/** Log the provided arguments if the analyser is in debug mode. */
>>>>>>> wip: change GCD estimation to Adapter step
	protected debug(...data: LogParameters): void
	protected debug(...args: [DebugCallback] | LogParameters) {
		const constructor = this.constructor as typeof Loggable
		if (!constructor.debug || process.env.NODE_ENV === 'production') {
			return
		}

		typeof args[0] === 'function'
			? args[0]({log: this.debugLog})
			: this.debugLog(...args)
	}

	private debugLog = (...data: LogParameters) => {
		const constructor = this.constructor as typeof Loggable
		// eslint-disable-next-line no-console
		console.log(
			`[%c${constructor.name}%c]`,
			`color: ${seededColor(constructor.name)}`,
			'color: inherit',
			...data,
		)
	}
}
