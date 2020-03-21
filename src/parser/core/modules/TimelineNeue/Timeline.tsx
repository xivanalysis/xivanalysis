import Module from 'parser/core/Module'
import React from 'react'
import {Axis, Item, LabelSpacer, Row, ScaleHandler, SetViewFn} from './components'
import {Item as ItemConfig, Row as RowConfig, SimpleItem, SimpleRow} from './config'

const MINIMUM_ZOOM = 10000 // 10 seconds (~4 gcds)

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	private setView?: SetViewFn

	private exposeSetView = (handler: SetViewFn) => {
		this.setView = handler
	}

	output() {
		const rows = TEST_ROWS

		// TODO: ScaleHandler & LabelSpacer should probably be rolled together. Probably with a top level Container, too.
		return <>
			<LabelSpacer>
			<ScaleHandler
				min={0}
				max={this.parser.fightDuration}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			>
				<Row>
					<Row>
						{rows.map(this.renderRow)}
					</Row>
					<Axis/>
				</Row>
			</ScaleHandler>
			</LabelSpacer>
			<button onClick={() => this.setView?.([500, 1000])}>Don't press this.</button>
		</>
	}

	private renderRow = (row: RowConfig, index: number) => (
		<Row key={index} label={row.label} height={row.height}>
			{row.rows.map(this.renderRow)}
			{row.items.map(this.renderItem)}
		</Row>
	)

	private renderItem = (item: ItemConfig, index: number) => (
		<Item key={index} start={item.start} end={item.end}>
			{item.content}
		</Item>
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
