import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import {
	SetViewFn,
	Timeline as TimelineComponent,
} from './components'
import {
	Item as ItemConfig,
	Row as RowConfig,
} from './config'

// We default to showing the first minute of the pull. Showing the entire fight at once
// is overwhelming for an initial view.
const INITIAL_END = 60000 // One minute

const MINIMUM_ZOOM = 10000 // 10 seconds (~4 gcds)

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000
	static displayMode = DISPLAY_MODE.FULL

	private setView?: SetViewFn

	private rows: RowConfig[] = []
	private items: ItemConfig[] = []

	/**
	 * Add a row to the timeline.
	 * @param row The row to add
	 * @returns The added row
	 */
	addRow<T extends RowConfig>(row: T): T {
		this.rows.push(row)
		return row
	}

	/**
	 * Add a new global item to the timeline. The added item will not be scoped
	 * to a row, and hence will span the height of the entire timeline.
	 * @param item The item to add globally
	 * @returns The added item
	 */
	addItem<T extends ItemConfig>(item: T): T {
		this.items.push(item)
		return item
	}

	/**
	 * Move & zoom the viewport to show the specified range
	 * @param start Timestamp of the start of the range
	 * @param end Timestamp of the end of the range
	 * @param scrollTo If true, the page will be scrolled to reveal the timeline
	 */
	show(start: number, end: number, scrollTo: boolean = true) {
		this.setView?.([start, end])

		if (scrollTo) {
			this.parser.scrollTo(Timeline.handle)
		}
	}

	private exposeSetView = (handler: SetViewFn) => {
		this.setView = handler
	}

	output() {
		return (
			<TimelineComponent
				rows={this.rows}
				items={this.items}

				min={0}
				max={this.parser.fightDuration}
				end={Math.min(this.parser.fightDuration, INITIAL_END)}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			/>
		)
	}
}
