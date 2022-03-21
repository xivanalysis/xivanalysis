import _ from 'lodash'

export interface HistoryEntry<T> {
	/**
	 * The timestamp at which the entry started.
	 */
	start: number
	/**
	 * The timestamp at which the entry ended or undefined if the entry is open.
	 */
	end?: number
	/**
	 * The data for this entry.
	 */
	data: T
}

export class History<T> {

	/**
	 * Contains all entries created by the tracker.
	 */
	public entries: Array<HistoryEntry<T>> = []

	private dataInitializer: () => T

	/**
	 * Creates a tracker with the specified initialization function
	 * @param initializer Creates data for a new entry when one is opened.
	 */
	constructor(initializer: () => T) {
		this.dataInitializer = initializer
	}

	/**
	 * Gets the currently open entry or returns undefined if there is
	 * no currently open entry.
	 */
	public getCurrent() {
		const last = _.last(this.entries)
		if (last != null && last.end == null) {
			return last
		}
		return undefined
	}

	/**
	 * Executes an action on the current entry's data if an entry is currently open.
	 * @param action The action to be executed on the data of the open entry. Ignored if no entry is open.
	 */
	public doIfOpen(action: (current: T) => void) {
		const current = this.getCurrent()
		if (current != null) { action(current.data) }
	}

	/**
	 * Opens a new entry at the specified time and closes any
	 * previously active entry.
	 * @param timestamp The timestamp at which the new entry will be started.
	 */
	public openNew(timestamp: number) {
		this.closeCurrent(timestamp)
		return this.open(timestamp)
	}

	/**
	 * Gets the currently open entry if there is one or opens a new
	 * entry if there is no currently open entry.
	 * @param timestamp The timestamp at which a new entry will be started if a new one is opened.
	 */
	public getCurrentOrOpenNew(timestamp: number) {
		return this.getCurrent() ?? this.open(timestamp)
	}

	/**
	 * Closes the current entry.
	 * If the most recent entry is already closed, no action is taken
	 * @param timestamp The timestamp at which the entry is closed.
	 */
	public closeCurrent(timestamp: number) {
		const current = this.getCurrent()
		if (current != null) { current.end = timestamp }
	}

	/**
	 * Reopens the last entry and returns it.
	 * If the previous entry was still open, returns the entry as is.
	 * If there is no previous entry, does nothing and returns undefined.
	 */
	public reopenLastEntry() {
		const last = _.last(this.entries)
		if (last != null) {
			last.end = undefined
		}
		return last
	}

	/**
	 * Returns the end of the last entry.
	 * If there is no previous entry or if the current entry is still open,
	 * returns undefined
	 */
	public endOfLastEntry() {
		const last = _.last(this.entries)
		if (last != null) {
			return last.end
		}
		return undefined
	}

	/**
	 * Opens a new entry and adds it to the history.
	 * Assumes any existing entry has been closed.
	 * @param timestamp The timestamp at which the entry is opened.
	 * @returns The new entry
	 */
	private open(timestamp: number) {
		const current: HistoryEntry<T> = {start: timestamp, data: this.dataInitializer()}

		this.entries.push(current)
		return current
	}

}
