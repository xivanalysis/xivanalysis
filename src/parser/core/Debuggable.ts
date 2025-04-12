import {seededColor} from 'utilities/color'

// Helper types for debug
type LogParameters = Parameters<typeof console.log>
type DebugCallback = (opts: {
	/** Log the provided arguments. */
	log: (...data: LogParameters) => void,
}) => void

export abstract class Debuggable {
	/**
	 * Set to `true` to enable debug mode for this debuggable class, allowing the execution
	 * of any calls to the debug method.
	 */
	static debug = false

	/** Execute the provided callback if the debuggable is in debug mode. */
	protected debug(callback: DebugCallback): void
	/** Log the provided arguments if the debuggable is in debug mode. */
	protected debug(...data: LogParameters): void
	protected debug(...args: [DebugCallback] | LogParameters) {
		const constructor = this.constructor as typeof Debuggable
		if (!constructor.debug || process.env.NODE_ENV === 'production') {
			return
		}

		if (typeof args[0] === 'function') {
			args[0]({log: this.debugLog})
		} else {
			this.debugLog(...args)
		}
	}

	private debugLog = (...data: LogParameters) => {
		const constructor = this.constructor as typeof Debuggable
		// eslint-disable-next-line no-console
		console.log(
			`[%c${constructor.name}%c]`,
			`color: ${seededColor(constructor.name)}`,
			'color: inherit',
			...data,
		)
	}
}
