import Module from 'parser/core/Module'
import React from 'react'
import {Axis, Container, Item, Row, ScaleHandler, SetViewFn} from './components'

const MINIMUM_ZOOM = 10000 // 10 seconds (~4 gcds)

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	private setView?: SetViewFn

	private exposeSetView = (handler: SetViewFn) => {
		this.setView = handler
	}

	output() {
		return <>
			<ScaleHandler
				min={0}
				max={this.parser.fightDuration}
				zoomMin={MINIMUM_ZOOM}
				exposeSetView={this.exposeSetView}
			>
				<Container>
					<Container>
						<Row>
							<Item time={741}><TempShowSize>Test 1</TempShowSize></Item>
						</Row>
						<Row>
							<Item start={1563} end={4123}><TempShowSize>Test 2</TempShowSize></Item>
						</Row>
						<Item time={5341}><TempShowSize>Test 3</TempShowSize></Item>
					</Container>
					<Axis/>
				</Container>
			</ScaleHandler>
			<button onClick={() => this.setView?.([500, 1000])}>Don't press this.</button>
		</>
	}
}

const TempShowSize = ({children}: {children: React.ReactNode}) => (
	<div style={{background: 'rgba(255, 0, 0, 0.3)', width: '100%', height: '100%'}}>
		{children}
	</div>
)
