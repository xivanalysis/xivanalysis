import {Analyser} from 'parser/core/Analyser'
import {GAUGE_HANDLE} from '../ResourceGraphs/ResourceGraphs'
import {AbstractGauge, AbstractGaugeOptions, GaugeGraphOptions} from './AbstractGauge'

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

interface TimerDownWindow {
	start: number
	end: number
}

export interface TimerGaugeOptions extends AbstractGaugeOptions {
	/** Maxiumum duration of the gauge, in milliseconds. */
	maximum: number

	/** Callback executed when the timer expires. */
	onExpiration?: () => void

	/** Graph options. Omit to disable graphing for this gauge. */
	graph?: GaugeGraphOptions,
}

export class TimerGauge extends AbstractGauge {
	// Just in case I ever have to change it lmao
	private readonly minimum = 0
	private readonly maximum: number
	private readonly expirationCallback?: () => void
	private readonly graphOptions?: GaugeGraphOptions

	private hook?: ReturnType<Analyser['addTimestampHook']>
	private history: State[] = []

	// TODO: Work out how to remove this reliance on having it passed down
	private _addTimestampHook?: Analyser['addTimestampHook']
	private get addTimestampHook() { return expectExist(this._addTimestampHook) }

	private _removeTimestampHook?: Analyser['removeTimestampHook']
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

		const delta = this.parser.currentEpochTimestamp - this.lastKnownState.timestamp
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

	/** Whether the gauge is currently running */
	get active(): boolean {
		return !(this.expired || this.paused)
	}

	constructor(opts: TimerGaugeOptions) {
		super(opts)

		this.maximum = opts.maximum
		this.expirationCallback = opts.onExpiration
		this.graphOptions = opts.graph
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
	 * If the gauge has expired, this will have no effect.
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
		const timestamp = this.parser.currentEpochTimestamp

		// Push the timer state prior to the event into the history
		this.history.push({
			timestamp,
			remaining: this.remaining,
			paused: this.paused,
		})

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

	raise() { /** noop */ }

	init() {
		if (this.history.length === 0) {
			this.reset()
		}
	}

	private onExpiration = () => {
		if (this.expirationCallback) {
			this.expirationCallback()
		}
		this.history.push({
			timestamp: this.parser.currentEpochTimestamp,
			remaining: this.remaining,
			paused: false,
		})
	}

	/** @inheritdoc */
	override generateResourceGraph() {
		// Skip charting if they've not enabled it
		if (!this.graphOptions) {
			return
		}

		// Insert a data point at the end of the timeline
		this.pause()

		const {handle, label, color} = this.graphOptions
		const graphData = {
			label,
			colour: color,
			data: this.history.map(entry => {
				return {time: entry.timestamp, current: entry.remaining / 1000, maximum: this.maximum / 1000}
			}),
			linear: true,
		}
		if (handle != null) {
			this.resourceGraphs.addDataGroup({...this.graphOptions, handle})
			this.resourceGraphs.addData(handle, graphData)
		} else {
			this.resourceGraphs.addGauge(graphData, {...this.graphOptions, handle: GAUGE_HANDLE})
		}
	}

	// Junk I wish I didn't need
	setAddTimestampHook(value: Analyser['addTimestampHook']) {
		this._addTimestampHook = value
	}

	setRemoveTimestampHook(value: Analyser['removeTimestampHook']) {
		this._removeTimestampHook = value
	}

	private internalDowntime(start = this.parser.pull.timestamp, end = this.parser.currentEpochTimestamp) {
		let currentStart: number | undefined = undefined
		const downtimeWindows: TimerDownWindow[] = []

		this.history.forEach(entry => {
			if (entry.remaining <= this.minimum && currentStart == null) {
				currentStart = entry.timestamp
			}
			if (entry.remaining > this.minimum && currentStart != null) {
				downtimeWindows.push({start: currentStart, end: entry.timestamp})
				currentStart = undefined
			}
		})

		if (downtimeWindows.length === 0) { return [] }

		const finalDowntimes: TimerDownWindow[] = []
		downtimeWindows.forEach(downtime => {
			if (downtime.end > start || downtime.start < end) {
				finalDowntimes.push(downtime)
			}
		})

		return finalDowntimes
	}

	public isDowntime(when = this.parser.currentEpochTimestamp) {
		return this.internalDowntime(when, when).length > 0
	}

	public getDowntime(start = this.parser.pull.timestamp, end = this.parser.currentEpochTimestamp) {
		return this.internalDowntime(start, end).reduce(
			(totalDowntime, currentWindow) => totalDowntime + Math.min(currentWindow.end, end) - Math.max(currentWindow.start, start),
			0,
		)
	}

	public getDowntimeWindows(start = this.parser.pull.timestamp, end = this.parser.currentEpochTimestamp) {
		return this.internalDowntime(start, end).reduce<TimerDownWindow[]>(
			(windows, window) => {
				windows.push({
					start: Math.max(window.start, start),
					end: Math.min(window.end, end),
				})
				return windows
			},
			[],
		)
	}
}
