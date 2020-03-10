import Module from 'parser/core/Module'
import React from 'react'
import {Component, SetViewFn} from './Component'

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	private setView?: SetViewFn

	private exposeSetView = (handler: SetViewFn) => {
		this.setView = handler
	}

	output() {
		return <>
			<Component
				max={this.parser.fightDuration}
				exposeSetView={this.exposeSetView}
			/>
			<button onClick={() => this.setView?.([500, 1000])}>Don't press this.</button>
		</>
	}
}
