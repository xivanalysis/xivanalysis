import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import React from 'react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {
	SetViewFn,
	Timeline as TimelineComponent,
} from './components'
import {
	Item as ItemConfig,
	Row as RowConfig,
	SimpleRow,
} from './config'
import styles from './Timeline.module.css'

// We default to showing the first minute of the pull. Showing the entire fight at once
// is overwhelming for an initial view.
const INITIAL_END = 60000 // One minute

const MINIMUM_ZOOM = 10000 // 10 seconds (~4 gcds)

export class Timeline extends Analyser {
	static override handle = 'timeline'
	static override displayOrder = DISPLAY_ORDER.TIMELINE
	static override displayMode = DisplayMode.FULL
	static override title = t('core.timeline.title')`Timeline`

	private setView?: SetViewFn

	// private rows: RowConfig[] = []
	// private items: ItemConfig[] = []

	private rootRow: SimpleRow = new SimpleRow()

	/**
	 * Add a row to the timeline.
	 * @param row The row to add
	 * @returns The added row
	 */
	addRow<T extends RowConfig>(row: T): T {
		// this.rows.push(row)
		this.rootRow.addRow(row)
		return row
	}

	/**
	 * Add a new global item to the timeline. The added item will not be scoped
	 * to a row, and hence will span the height of the entire timeline.
	 * @param item The item to add globally
	 * @returns The added item
	 */
	addItem<T extends ItemConfig>(item: T): T {
		// this.items.push(item)
		this.rootRow.addItem(item)
		return item
	}

	/**
	 * Move & zoom the viewport to show the specified range
	 * @param start Timestamp of the start of the range
	 * @param end Timestamp of the end of the range
	 * @param scrollTo If true, the page will be scrolled to reveal the timeline
	 */
	show = (start: number, end: number, scrollTo: boolean = true) => {
		this.setView?.([start, end])

		if (scrollTo) {
			this.parser.scrollTo(Timeline.handle)
		}
	}
	private exposeSetView = (handler: SetViewFn) => {
		this.setView = handler
	}

	override output() {
		return <>
			<Trans id="core.timeline.help-text" render="span" className={styles.helpText}>
				Scroll or click+drag to pan, ctrl+scroll or pinch to zoom.
			</Trans>
			<TimelineComponent
				// rows={this.rows}
				// items={this.items}
				row={this.rootRow}

				min={0}
				max={this.parser.currentDuration}
				end={Math.min(this.parser.currentDuration, INITIAL_END)}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			/>
		</>
	}
}
