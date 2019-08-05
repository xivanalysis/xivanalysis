export interface AbstractGaugeOptions {
	/** Function that should return the timestamp of the current state of the parse run. */
	getTimestamp?: () => number
}

export abstract class AbstractGauge {
	private getTimestamp?: () => number

	/** The current timestamp of the parse. */
	protected get timestamp() {
		if (!this.getTimestamp) {
			throw new Error('No timestamp accessor set. Ensure this gauge is being passed to the core gauge module, or initialised with a `getTimestamp` methd.')
		}

		return this.getTimestamp()
	}

	constructor(opts: AbstractGaugeOptions) {
		this.getTimestamp = opts.getTimestamp
	}

	/** Set the function used to retrieve the current timestamp. */
	setGetTimestamp(fn: () => number) {
		this.getTimestamp = fn
	}

	/** Reset any values stored within the gauge to their initial state. */
	abstract reset(): void
}
