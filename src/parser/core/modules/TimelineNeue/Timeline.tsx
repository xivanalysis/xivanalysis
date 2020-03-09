import Module from 'parser/core/Module'
import React from 'react'
import {Component} from './Component'

export class Timeline extends Module {
	static handle = 'timelineNeue'
	static displayOrder = -1000

	output() {
		return <Component max={this.parser.fightDuration}/>
	}
}
