import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import {
	Item as ItemComponent,
	Row as RowComponent,
	SetViewFn,
	// Timeline as TimelineComponent,
} from './components'
import {Timeline as TimelineComponent} from './components2'
import {
	Item as ItemConfig,
	Row as RowConfig,
	SimpleRow,
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

	protected init() {
		this.rows = fakeShit.slice()
	}

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
		return <>
			{/* <TimelineComponent
				min={0}
				max={this.parser.fightDuration}
				end={Math.min(this.parser.fightDuration, INITIAL_END)}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			>
				{this.renderRows(this.rows)}
				{this.items.map(this.renderItem)}
			</TimelineComponent> */}
			<TimelineComponent
				rows={this.rows}
			/>
		</>
	}

	private renderRows = (rows: RowConfig[]) =>
		rows
			.slice()
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map(this.renderRow)

	private renderRow = (row: RowConfig, index: number) => {
		// If the row is entirely empty, ignore it so it doesn't clutter up the display
		if (this.getRowItemCount(row) === 0) {
			return null
		}

		return (
			<RowComponent key={index} label={row.label} height={row.height}>
				{this.renderRows(row.rows)}
				{row.items.map(this.renderItem)}
			</RowComponent>
		)
	}

	private renderItem = (item: ItemConfig, index: number) => (
		<ItemComponent key={index} start={item.start} end={item.end}>
			<item.Content/>
		</ItemComponent>
	)

	private getRowItemCount = (row: RowConfig): number =>
		row.items.length + row.rows.reduce((acc, cur) => acc + this.getRowItemCount(cur), 0)
}

const fakeShit = [new SimpleRow({
	order: -Infinity,
	label: 'One',
	rows: [
		new SimpleRow({
			label: 'Two',
			rows: [
				new SimpleRow({
					label: 'Three',
					rows: [
						new SimpleRow({
							label: 'Four',
						}),
						new SimpleRow({
							label: 'Five',
						}),
					],
				}),
			],
		}),
		new SimpleRow({label: 'Two Point Five'}),
	],
})]
