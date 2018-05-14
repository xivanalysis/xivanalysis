import React from 'react'
import VisTimeline from 'react-visjs-timeline'
import vis from 'vis/dist/vis-timeline-graph2d.min'

import Module, { DISPLAY_ORDER } from 'parser/core/Module'

import './Timeline.module.css'

export default class Timeline extends Module {
	static displayOrder = DISPLAY_ORDER.BOTTOM
	name = 'Timeline'

	groups = []
	items = []

	// TODO: Do more with these, it's pretty bad rn
	addGroup(group) {
		this.groups.push(group)
	}

	addItem(item) {
		this.items.push(item)
	}

	output() {
		const options = {
			// General styling
			width: '100%',
			align: 'left',
			stack: false,
			showCurrentTime: false,

			// Date/time formatting
			moment: (date) => vis.moment(date).utc(),
			maxMinorChars: 4,
			format: {
				minorLabels: {
					minute: 'm[m]'
				},
				majorLabels: {
					second: 'm[m]',
					minute: ''
				}
			},

			// View constraints
			min: 0,
			max: this.parser.fightDuration,
			zoomMin: 10000,

			// View defaults
			// Show first minute by default, full fight view is a bit hard to grok.
			start: 0,
			end: Math.min(this.parser.fightDuration, 60000)
		}

		return <VisTimeline
			options={options}
			groups={this.groups.map(group => group.getObject())}
			items={this.items.map(item => item.getObject())}
		/>
	}
}
