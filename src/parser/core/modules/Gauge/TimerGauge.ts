import Module, {TimestampHook} from 'parser/core/Module'
import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

function expectExist<T>(value?: T) {
	if (!value) {
		throw new Error('Missing something required. Check the stack trace.')
	}

	return value
}

interface State {
	timestamp: number
	remaining: number
}

export interface TimerGaugeOptions extends AbstractGaugeOptions {
	/** Maxiumum duration of the gauge. */
	maximum: number

	/** Callback executed when the timer expires. */
	onExpiration?: () => void
}

export class TimerGauge extends AbstractGauge {
	// Just in case I ever have to change it lmao
	private readonly minimum = 0
	private maximum: number
	private lastKnownState?: State
	private expirationCallback?: () => void
	private hook?: TimestampHook

	// TODO: Work out how to remove this reliance on having it passed down
	private _addTimestampHook?: Module['addTimestampHook']
	private get addTimestampHook() { return expectExist(this._addTimestampHook) }

	private _removeTimestampHook?: Module['removeTimestampHook']
	private get removeTimestampHook() { return expectExist(this._removeTimestampHook) }

	/** Time currently remaining on the timer. */
	get remaining() {
		// If there's no known state, we have to assume there's no time left
		if (!this.lastKnownState) {
			return this.minimum
		}

		const delta = this.parser.currentTimestamp - this.lastKnownState.timestamp
		return Math.max(this.minimum, this.lastKnownState.remaining - delta)
	}

	constructor(opts: TimerGaugeOptions) {
		super(opts)

		this.maximum = opts.maximum
		this.expirationCallback = opts.onExpiration
	}

	/** @inheritdoc */
	reset() {
		this.set(this.minimum)
	}

	/** Refresh the gauge to its maximum value. */
	refresh() {
		this.set(this.maximum)
	}

	/** Add time to the gauge. Time over the maxium will be lost. */
	add(duration: number) {
		this.set(this.remaining + duration)
	}

	/** Set the time remaining on the timer to the given duration. Value will be bounded by provided maximum. */
	set(duration: number) {
		const timestamp = this.parser.currentTimestamp
		const remaining = Math.max(this.minimum, Math.min(duration, this.maximum))

		this.lastKnownState = {
			timestamp,
			remaining,
		}

		// Remove any existing hook
		if (this.hook) {
			this.removeTimestampHook(this.hook)
		}

		// If we've not yet expired, set up a hook to wait for that
		if (remaining > 0) {
			this.hook = this.addTimestampHook(timestamp + remaining, this.onExpiration)
		}
	}

	private onExpiration = () => {
		if (this.expirationCallback) {
			this.expirationCallback()
		}
	}

	// Junk I wish I didn't need
	setAddTimestampHook(value: Module['addTimestampHook']) {
		this._addTimestampHook = value
	}

	setRemoveTimestampHook(value: Module['removeTimestampHook']) {
		this._removeTimestampHook = value
	}
}
