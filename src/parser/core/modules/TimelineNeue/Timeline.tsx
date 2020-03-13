import Module from 'parser/core/Module'
import React, {useState} from 'react'
import {Axis, Container, Item, LabelSpacer, Row, ScaleHandler, SetViewFn} from './components'

const MINIMUM_ZOOM = 10000 // 10 seconds (~4 gcds)

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	private setView?: SetViewFn

	private exposeSetView = (handler: SetViewFn) => {
		this.setView = handler
	}

	output() {
		// TODO: ScaleHandler & LabelSpacer should probably be rolled together. Probably with a top level Container, too.
		return <>
			<LabelSpacer>
			<ScaleHandler
				min={0}
				max={this.parser.fightDuration}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			>
				<Container>
					<Container>
						<Row label="parent">
							<Row label="hello">
								<Row label="nested"></Row>
								<Row label="nested2">
									<Item time={0}><TempShowSize>Test 4</TempShowSize></Item>
								</Row>
								<Item time={741}><TempShowSize>Test 1</TempShowSize></Item>
							</Row>
							<Row label="world!">
								<Item start={1563} end={4123}><TempShowSize>Test 2</TempShowSize></Item>
							</Row>
							<Item time={5341}><TempShowSize>Test 3</TempShowSize></Item>
						</Row>
						<RowTest/>
					</Container>
					<Axis/>
				</Container>
			</ScaleHandler>
			</LabelSpacer>
			<button onClick={() => this.setView?.([500, 1000])}>Don't press this.</button>
		</>
	}
}

const RowTest = () => {
	const [show, setShow] = useState(true)
	if (!show) { return <Item time={10000}><button onClick={() => setShow(true)}>Click to unboom</button></Item> }
	return (
		<Row label="Really long label">
			<Item time={10000}>
				<button onClick={() => setShow(false)}>Click to boom</button>
			</Item>
		</Row>
	)
}

const TempShowSize = ({children}: {children: React.ReactNode}) => (
	<div style={{background: 'rgba(255, 0, 0, 0.3)', width: '100%', height: '100%'}}>
		{children}
	</div>
)
