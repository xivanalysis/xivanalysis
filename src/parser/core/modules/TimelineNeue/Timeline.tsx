import Module from 'parser/core/Module'
import React from 'react'
import {
	Item as ItemComponent,
	Row as RowComponent,
	SetViewFn,
	Timeline as TimelineComponent,
} from './components'
import {
	Item as ItemConfig,
	Row as RowConfig,
	SimpleItem,
	SimpleRow,
} from './config'

// We default to showing the first minute of the pull. Showing the entire fight at once
// is overwhelming for an initial view.
const INITIAL_END = 60000 // One minute

const MINIMUM_ZOOM = 10000 // 10 seconds (~4 gcds)

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	private setView?: SetViewFn

	private rows: RowConfig[] = []
	private items: ItemConfig[] = []

	protected init() {
		this.rows = TEST_ROWS
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
			<TimelineComponent
				min={0}
				max={this.parser.fightDuration}
				end={Math.min(this.parser.fightDuration, INITIAL_END)}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			>
				{this.rows.map(this.renderRow)}
				{this.items.map(this.renderItem)}
			</TimelineComponent>
		</>
	}

	private renderRow = (row: RowConfig, index: number) => (
		<RowComponent key={index} label={row.label} height={row.height}>
			{row.rows.map(this.renderRow)}
			{row.items.map(this.renderItem)}
		</RowComponent>
	)

	private renderItem = (item: ItemConfig, index: number) => (
		<ItemComponent key={index} start={item.start} end={item.end}>
			<item.Content/>
		</ItemComponent>
	)
}

const TempShowSize = ({children}: {children: React.ReactNode}) => (
	<div style={{background: 'rgba(255, 0, 0, 0.3)', width: '100%', height: '100%'}}>
		{children}
	</div>
)

const TEST_ROWS = [
	new SimpleRow({
		label: 'parent',
		rows: [
			new SimpleRow({label: 'test'}),
			new SimpleRow({
				label: 'hello',
				rows: [
					new SimpleRow({label: 'nested'}),
					new SimpleRow({
						label: 'nested2',
						items: [new SimpleItem({start: 0, content: <TempShowSize>Test 4</TempShowSize>})],
					}),
				],
				items: [new SimpleItem({start: 741, content: <TempShowSize>Test 1</TempShowSize>})],
			}),
			new SimpleRow({
				label: 'world',
				items: [new SimpleItem({start: 1563, end: 4123, content: <TempShowSize>Test 2</TempShowSize>})],
			}),
		],
		items: [new SimpleItem({start: 5341, content: <TempShowSize>Test 3</TempShowSize>})],
	}),
	new SimpleRow({label: 'Really long label'}),
]
