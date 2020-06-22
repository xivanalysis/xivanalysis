import {ChartDataSets} from 'chart.js'
import Color from 'color'
import Module from 'parser/core/Module'
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
	paused: boolean
}

export interface TimerGaugeOptions extends AbstractGaugeOptions {
	/** Maxiumum duration of the gauge, in milliseconds. */
	maximum: number

	/** Callback executed when the timer expires. */
	onExpiration?: () => void

	/** Chart options. Omit to disable charting for this gauge. */
	chart?: TimerChartOptions,
}

// TODO: Some of this will be shared config with counter, etc. - look into sharing?
export interface TimerChartOptions {
	/** Label to display on the data set. */
	label: string

	/** Colour to draw the data set in. Defaults to grey. */
	color?: string | Color
}

export class TimerGauge extends AbstractGauge {
	// Just in case I ever have to change it lmao
	private readonly minimum = 0
	private readonly maximum: number
	private readonly expirationCallback?: () => void
	private readonly chartOptions?: TimerChartOptions

	private hook?: ReturnType<Module['addTimestampHook']>
	private history: State[] = []

	// TODO: Work out how to remove this reliance on having it passed down
	private _addTimestampHook?: Module['addTimestampHook']
	private get addTimestampHook() { return expectExist(this._addTimestampHook) }

	private _removeTimestampHook?: Module['removeTimestampHook']
	private get removeTimestampHook() { return expectExist(this._removeTimestampHook) }

	/** The most recent state  */
	private get lastKnownState() {
		const {length} = this.history
		if (length === 0) {
			return
		}
		return this.history[length - 1]
	}

	/** Time currently remaining on the timer. */
	get remaining() {
		// If there's no known state, we have to assume there's no time left
		if (!this.lastKnownState) {
			return this.minimum
		}

		// If we're paused, the time remaining always === specified state remaining
		if (this.lastKnownState.paused) {
			return this.lastKnownState.remaining
		}

		const delta = this.parser.currentTimestamp - this.lastKnownState.timestamp
		return Math.max(this.minimum, this.lastKnownState.remaining - delta)
	}

	/** Whether the gauge has expired. */
	get expired() {
		return this.remaining <= this.minimum
	}

	/** Whether the gauge is currently paused. */
	get paused() {
		// If there's no state, we're neither paused nor running - but safer to assume running.
		if (!this.lastKnownState) {
			return false
		}

		return this.lastKnownState.paused
	}

	constructor(opts: TimerGaugeOptions) {
		super(opts)

		this.maximum = opts.maximum
		this.expirationCallback = opts.onExpiration
		this.chartOptions = opts.chart
	}

	/** @inheritdoc */
	reset() {
		this.set(this.minimum)
	}

	/**
	 * Start the timer from its maximum value
	 */
	start() {
		this.set(this.maximum)
	}

	/**
	 * Refresh the gauge to its maximum value.
	 * If the gauge has expired, this will have no effect.
	 */
	refresh() {
		if (this.expired) {
			return
		}
		this.start()
	}

	/**
	 * Add time to the gauge. Time over the maxium will be lost.
	 * If the gauge has edxpired, this will have no effect.
	 */
	extend(duration: number) {
		if (this.expired) {
			return
		}
		this.set(this.remaining + duration)
	}

	/** Pause the timer at its current state. */
	pause() {
		this.set(this.remaining, true)
	}

	/** Resume the timer from its paused state. */
	resume() {
		this.set(this.remaining, false)
	}

	/** Set the time remaining on the timer to the given duration. Value will be bounded by provided maximum. */
	set(duration: number, paused: boolean = false) {
		const timestamp = this.parser.currentTimestamp
		const remaining = Math.max(this.minimum, Math.min(duration, this.maximum))

		// Push a new state onto the history
		this.history.push({
			timestamp,
			remaining,
			paused,
		})

		// Remove any existing hook
		if (this.hook) {
			this.removeTimestampHook(this.hook)
		}

		// If we've not yet expired, and we're not paused, set up a hook to wait for that
		if (!paused && remaining > 0) {
			this.hook = this.addTimestampHook(timestamp + remaining, this.onExpiration)
		}
	}

	private onExpiration = () => {
		if (this.expirationCallback) {
			this.expirationCallback()
		}
	}

	/** @inheritdoc */
	generateDataset() {
		// Skip charting if they've not enabled it
		if (!this.chartOptions) {
			return
		}

		// Translate state history into a dataset that makes sense for the chart
		const startTime = this.parser.eventTimeOffset
		const endTime = startTime + this.parser.pull.duration
		const data: Array<{t: number, y?: number}> = []
		this.history.forEach(entry => {
			const relativeTimestamp = entry.timestamp - startTime

			// Adjust preceeding data for the start of this state's window
			const {length} = data
			if (length > 0 && relativeTimestamp < data[length - 1].t) {
				// If we're updating prior to the previous entry's expiration, update the previous entry
				// with its state at this point in time - we'll end up with two points showing the update on
				// this timestamp.
				const prev = data[length - 1]
				prev.y = (prev.y || this.minimum / 1000) + ((prev.t - relativeTimestamp) / 1000)
				prev.t = relativeTimestamp

			} else {
				// This window is starting fresh, not extending - insert a blank entry so the chart doesn't
				// render a line from the previous.
				data.push({t: relativeTimestamp})
			}

			// Insert the data point for the start of this window.
			// Skip for pauses, as the updated previous point will represent the start point of the pause
			const chartY = (this.minimum + entry.remaining) / 1000
			if (!entry.paused) {
				data.push({
					t: relativeTimestamp,
					y: chartY,
				})
			}

			// If the state isn't paused, insert a data point for the time it will expire.
			// This data point will be updated in the event of an extension.
			if (!entry.paused && entry.remaining > 0) {
				const time = Math.min(relativeTimestamp + entry.remaining, endTime - startTime)
				const timeDelta = time - relativeTimestamp
				data.push({
					t: time,
					y: (this.minimum + entry.remaining - timeDelta) / 1000,
				})
			}
		})

		const {label, color} = this.chartOptions
		const dataSet: ChartDataSets = {
			label,
			data,
			lineTension: 0,
		}

		if (color) {
			/* tslint:disable:no-magic-numbers */
			const chartColor = Color(color)
			dataSet.backgroundColor = chartColor.fade(0.8).toString()
			dataSet.borderColor = chartColor.fade(0.5).toString()
			/* tslint:enable:no-magic-numbers */
		}

		return dataSet
	}

	// Junk I wish I didn't need
	setAddTimestampHook(value: Module['addTimestampHook']) {
		this._addTimestampHook = value
	}

	setRemoveTimestampHook(value: Module['removeTimestampHook']) {
		this._removeTimestampHook = value
	}
}
